import "server-only";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { places } from "@/lib/places";
import {
  campaignStartNote,
  outreachMessage,
  toWhatsAppDigits,
  venueWhatsAppCandidates,
  whatsappJid,
} from "@/lib/outreach";

const AUTH_DIR = path.join(process.cwd(), ".merienda-whatsapp");
const PROGRESS_FILE = path.join(AUTH_DIR, "campaign-progress.json");
const SEND_TIMEOUT_MS = 16000;
const VENUE_GAP_MS = 5500;

/** Salieron de verdad antes de que se trabara el envío. No reenviar. */
const SENT_BEFORE_HANG = new Set([
  "la-coqueta",
  "gardel-confiteria",
  "el-ensueno-ullum",
  "cinco-uno",
  "entre-montanas",
  "casa-lena",
]);

export type SendRow = {
  slug: string;
  name: string;
  phase: "pendiente" | "a-mi" | "al-local" | "ok" | "sin-whatsapp" | "error";
  detail?: string;
};

export type BridgeSnapshot = {
  status: "idle" | "qr" | "connected" | "sending" | "error";
  qrDataUrl: string | null;
  me: string | null;
  error: string | null;
  sending: boolean;
  current: number;
  total: number;
  lastBeat: number;
  rows: SendRow[];
};

type WaSock = {
  user?: { id?: string };
  ev: {
    on: (event: string, cb: (...args: never[]) => void) => void;
  };
  sendMessage: (jid: string, content: { text: string }) => Promise<unknown>;
  onWhatsApp: (jid: string) => Promise<{ jid: string; exists: boolean }[] | undefined>;
  end: (error?: Error) => void;
};

type Bridge = {
  sock: WaSock | null;
  connecting: boolean;
  snapshot: BridgeSnapshot;
  stopRequested: boolean;
  runId: number;
  hydrated: boolean;
  logoutReset: boolean;
};

const globalForWa = globalThis as typeof globalThis & { meriendaWa?: Bridge };

function createBridge(): Bridge {
  return {
    sock: null,
    connecting: false,
    stopRequested: false,
    runId: 0,
    hydrated: false,
    logoutReset: false,
    snapshot: {
      status: "idle",
      qrDataUrl: null,
      me: null,
      error: null,
      sending: false,
      current: 0,
      total: 0,
      lastBeat: 0,
      rows: [],
    },
  };
}

function getBridge(): Bridge {
  if (!globalForWa.meriendaWa) globalForWa.meriendaWa = createBridge();
  return globalForWa.meriendaWa;
}

function isConfirmedSend(row: SendRow) {
  return row.phase === "ok" && (row.detail === "Salió de tu WhatsApp." || SENT_BEFORE_HANG.has(row.slug));
}

function repairRows(rows: SendRow[]): { rows: SendRow[]; changed: boolean } {
  let changed = false;
  const next = rows.map((row) => {
    if (row.phase === "ok" && !isConfirmedSend(row)) {
      changed = true;
      return { slug: row.slug, name: row.name, phase: "pendiente" as const };
    }
    return row;
  });
  return { rows: next, changed };
}

export async function getSnapshot(): Promise<BridgeSnapshot> {
  await hydrateProgress();
  const bridge = getBridge();
  const repaired = repairRows(bridge.snapshot.rows);
  if (repaired.changed) {
    const done = repaired.rows.filter((row) => row.phase === "ok" || row.phase === "sin-whatsapp").length;
    patch({
      rows: repaired.rows,
      current: done,
      total: repaired.rows.length,
      sending: false,
    });
    void persistRows(repaired.rows);
  } else if (bridge.snapshot.rows.length) {
    void persistRows(bridge.snapshot.rows);
  }
  return getBridge().snapshot;
}

async function hydrateProgress() {
  const bridge = getBridge();
  if (bridge.hydrated) return;
  bridge.hydrated = true;
  if (bridge.snapshot.rows.length) return;
  try {
    const raw = await readFile(PROGRESS_FILE, "utf8");
    const rows = JSON.parse(raw) as SendRow[];
    if (!Array.isArray(rows) || !rows.length) return;
    const recovered = rows.map((row) =>
      row.phase === "a-mi" || row.phase === "al-local"
        ? { ...row, phase: "pendiente" as const, detail: "Se trabó acá. Continuar lo reintenta." }
        : row
    );
    const done = recovered.filter((row) => row.phase === "ok" || row.phase === "sin-whatsapp").length;
    patch({
      rows: recovered,
      current: done,
      total: recovered.length,
      sending: false,
    });
  } catch {
    // primera vez, o el archivo no está
  }
}

async function clearAuthKeepingProgress() {
  let progress: string | null = null;
  try {
    progress = await readFile(PROGRESS_FILE, "utf8");
  } catch {
    progress = null;
  }
  await rm(AUTH_DIR, { recursive: true, force: true });
  await mkdir(AUTH_DIR, { recursive: true });
  if (progress) await writeFile(PROGRESS_FILE, progress, "utf8");
}

function disconnectCode(error?: { output?: { statusCode?: number }; statusCode?: number }) {
  return error?.output?.statusCode ?? error?.statusCode;
}

async function persistRows(rows: SendRow[]) {
  try {
    await mkdir(AUTH_DIR, { recursive: true });
    await writeFile(PROGRESS_FILE, JSON.stringify(rows), "utf8");
  } catch {
    // no bloquear el envío
  }
}

function patch(partial: Partial<BridgeSnapshot>) {
  const bridge = getBridge();
  bridge.snapshot = { ...bridge.snapshot, ...partial, lastBeat: Date.now() };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} tardó demasiado`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function connectWhatsApp(opts?: { reset?: boolean; afterLogout?: boolean }) {
  const bridge = getBridge();
  const mustReset = Boolean(opts?.reset) || (bridge.snapshot.status === "error" && !opts?.afterLogout);
  if (bridge.snapshot.status === "connected" && bridge.sock && !mustReset) return getSnapshot();
  if (bridge.connecting && !mustReset) return getSnapshot();

  if (mustReset) {
    try {
      bridge.sock?.end();
    } catch {
      // ya estaba cerrado
    }
    bridge.sock = null;
    bridge.connecting = false;
    await clearAuthKeepingProgress();
  }

  bridge.connecting = true;
  bridge.stopRequested = false;
  patch({ status: "qr", error: null, qrDataUrl: null });

  try {
    await mkdir(AUTH_DIR, { recursive: true });
    const baileys = await import("@whiskeysockets/baileys");
    const makeWASocket = baileys.default;
    const { DisconnectReason, Browsers } = baileys;
    const loadAuth = baileys.useMultiFileAuthState;
    const { state, saveCreds } = await loadAuth(AUTH_DIR);
    const sock = makeWASocket({
      auth: state,
      browser: Browsers.macOS("Chrome"),
      syncFullHistory: false,
      markOnlineOnConnect: false,
    }) as unknown as WaSock;
    bridge.sock = sock;

    sock.ev.on("creds.update", saveCreds as never);
    sock.ev.on("connection.update", (async (update: {
      connection?: string;
      lastDisconnect?: { error?: { output?: { statusCode?: number }; statusCode?: number } };
      qr?: string;
    }) => {
      if (update.qr) {
        const qrDataUrl = await QRCode.toDataURL(update.qr, { margin: 1, width: 280 });
        bridge.logoutReset = false;
        patch({ status: "qr", qrDataUrl, error: null });
      }
      if (update.connection === "open") {
        const me = sock.user?.id?.split(":")[0] ?? null;
        bridge.logoutReset = false;
        patch({ status: "connected", qrDataUrl: null, me, error: null });
        bridge.connecting = false;
      }
      if (update.connection === "close") {
        const code = disconnectCode(update.lastDisconnect?.error);
        bridge.sock = null;
        bridge.connecting = false;
        bridge.stopRequested = true;
        bridge.runId += 1;
        if (code === DisconnectReason.loggedOut) {
          if (bridge.logoutReset) {
            patch({
              status: "error",
              qrDataUrl: null,
              me: null,
              sending: false,
              error: "WhatsApp pidió volver a escanear. Tocá Mostrar código QR.",
            });
            return;
          }
          bridge.logoutReset = true;
          patch({
            status: "qr",
            qrDataUrl: null,
            me: null,
            sending: false,
            error: null,
          });
          void (async () => {
            await clearAuthKeepingProgress();
            await connectWhatsApp({ afterLogout: true });
          })();
          return;
        }
        if (code === DisconnectReason.restartRequired) {
          patch({ sending: false, status: "qr" });
          void connectWhatsApp({ afterLogout: true });
          return;
        }
        patch({
          status: "error",
          qrDataUrl: null,
          sending: false,
          error: "Se cortó WhatsApp. Tocá Mostrar código QR y después Continuar.",
        });
      }
    }) as never);
  } catch (error) {
    bridge.connecting = false;
    bridge.sock = null;
    patch({
      status: "error",
      error: error instanceof Error ? error.message : "No se pudo abrir WhatsApp.",
    });
  }

  return getSnapshot();
}

export async function disconnectWhatsApp() {
  const bridge = getBridge();
  bridge.stopRequested = true;
  bridge.runId += 1;
  try {
    bridge.sock?.end();
  } catch {
    // ya estaba cerrado
  }
  bridge.sock = null;
  bridge.connecting = false;
  patch({
    status: "idle",
    qrDataUrl: null,
    me: null,
    sending: false,
    error: null,
  });
  return getSnapshot();
}

export function stopSending() {
  const bridge = getBridge();
  bridge.stopRequested = true;
  bridge.runId += 1;
  patch({
    sending: false,
    status: bridge.sock ? "connected" : bridge.snapshot.status,
  });
  return bridge.snapshot;
}

async function resolveVenueJid(sock: WaSock, phone: string): Promise<string | null> {
  for (const digits of venueWhatsAppCandidates(phone)) {
    try {
      const result = await withTimeout(
        sock.onWhatsApp(whatsappJid(digits)),
        SEND_TIMEOUT_MS,
        "consulta WhatsApp"
      );
      const hit = result?.find((item) => item.exists);
      if (hit?.jid) return hit.jid;
    } catch {
      // probar el siguiente formato
    }
  }
  const fallback = toWhatsAppDigits(phone);
  return fallback ? whatsappJid(fallback) : null;
}

export async function sendCampaign(
  myPhone: string,
  slugs: string[],
  options?: { force?: boolean; alreadySent?: string[] }
) {
  await hydrateProgress();
  const bridge = getBridge();
  if (!bridge.sock || (bridge.snapshot.status !== "connected" && bridge.snapshot.status !== "sending")) {
    throw new Error("Primero vinculá tu WhatsApp con el código QR.");
  }
  const myDigits = toWhatsAppDigits(myPhone);
  if (!myDigits) throw new Error("Tu número no es válido.");
  if (bridge.snapshot.sending && !options?.force) {
    throw new Error("Ya hay un envío en curso. Si se trabó, tocá Continuar.");
  }

  const skip = new Set(
    bridge.snapshot.rows.filter((row) => isConfirmedSend(row) || row.phase === "sin-whatsapp").map((row) => row.slug)
  );
  for (const slug of options?.alreadySent ?? []) {
    const row = bridge.snapshot.rows.find((item) => item.slug === slug);
    if (!row || isConfirmedSend(row) || row.phase === "sin-whatsapp") skip.add(slug);
  }

  const requested = slugs.filter((slug) => !skip.has(slug));
  const targets = places.filter((place) => requested.includes(place.slug) && place.phone);
  if (!targets.length) throw new Error("No quedan locales con teléfono para enviar.");

  const sock = bridge.sock;
  const myJid = whatsappJid(myDigits);
  const runId = ++bridge.runId;
  bridge.stopRequested = false;
  const previous = new Map(bridge.snapshot.rows.map((row) => [row.slug, row]));
  const kept = bridge.snapshot.rows.filter((row) => skip.has(row.slug));
  const rows: SendRow[] = [
    ...kept,
    ...targets.map((place) => ({
      slug: place.slug,
      name: place.name,
      phase: "pendiente" as const,
      detail: previous.get(place.slug)?.phase === "a-mi" ? "Reintento" : undefined,
    })),
  ];
  const alreadyDone = kept.filter((row) => row.phase === "ok").length;
  patch({
    sending: true,
    status: "sending",
    rows,
    current: alreadyDone,
    total: alreadyDone + targets.length,
    error: null,
  });
  void persistRows(rows);

  void (async () => {
    const heartbeat = setInterval(() => {
      if (bridge.runId !== runId) {
        clearInterval(heartbeat);
        return;
      }
      patch({});
    }, 4000);

    try {
      if (!options?.force && alreadyDone === 0) {
        try {
          await withTimeout(
            sock.sendMessage(myJid, { text: campaignStartNote(targets.length) }),
            SEND_TIMEOUT_MS,
            "aviso a tu chat"
          );
        } catch {
          // Si tu chat está saturado, igual seguimos a los locales.
        }
      }

      for (const [offset, place] of targets.entries()) {
        if (bridge.runId !== runId || bridge.stopRequested) break;
        if (!bridge.sock) throw new Error("Se cortó WhatsApp.");
        const index = rows.findIndex((row) => row.slug === place.slug);
        const message = outreachMessage(place);
        rows[index] = { ...rows[index], phase: "al-local", detail: undefined };
        patch({ rows: [...rows], current: alreadyDone + offset + 1 });
        void persistRows(rows);

        const venueJid = await resolveVenueJid(sock, place.phone as string);
        if (bridge.runId !== runId || bridge.stopRequested) break;
        if (!venueJid) {
          rows[index] = {
            ...rows[index],
            phase: "sin-whatsapp",
            detail: "Ese número no aparece en WhatsApp.",
          };
          patch({ rows: [...rows] });
          void persistRows(rows);
          continue;
        }
        try {
          await withTimeout(
            sock.sendMessage(venueJid, { text: message }),
            SEND_TIMEOUT_MS,
            place.name
          );
          rows[index] = { ...rows[index], phase: "ok", detail: "Salió de tu WhatsApp." };
        } catch (error) {
          rows[index] = {
            ...rows[index],
            phase: "error",
            detail: error instanceof Error ? error.message : "No salió. Se sigue con el próximo.",
          };
        }
        patch({ rows: [...rows] });
        void persistRows(rows);
        await sleep(VENUE_GAP_MS);
      }

      const sentNow = rows.filter((row) => row.phase === "ok").length;
      const failed = rows.filter((row) => row.phase === "error").length;
      if (bridge.runId === runId && !bridge.stopRequested) {
        try {
          await withTimeout(
            sock.sendMessage(myJid, {
              text: `Claudio Larrea — Merienda. Van ${sentNow} enviados${failed ? `, ${failed} no salieron` : ""}. Si se trabó alguno, tocá Continuar.`,
            }),
            SEND_TIMEOUT_MS,
            "cierre a tu chat"
          );
        } catch {
          // el envío a los locales ya se hizo
        }
      }
    } catch (error) {
      if (bridge.runId === runId) {
        patch({
          error: error instanceof Error ? error.message : "Falló el envío.",
          status: bridge.sock ? "connected" : "error",
        });
      }
    } finally {
      clearInterval(heartbeat);
      if (bridge.runId === runId) {
        patch({
          sending: false,
          status: bridge.sock ? "connected" : bridge.snapshot.status,
          rows: [...rows],
        });
        void persistRows(rows);
      }
    }
  })();

  return getSnapshot();
}
