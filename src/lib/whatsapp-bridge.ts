import "server-only";

import { mkdir } from "node:fs/promises";
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
const SELF_GAP_MS = 2500;
const VENUE_GAP_MS = 7000;

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
};

const globalForWa = globalThis as typeof globalThis & { meriendaWa?: Bridge };

function createBridge(): Bridge {
  return {
    sock: null,
    connecting: false,
    stopRequested: false,
    snapshot: {
      status: "idle",
      qrDataUrl: null,
      me: null,
      error: null,
      sending: false,
      current: 0,
      total: 0,
      rows: [],
    },
  };
}

function getBridge(): Bridge {
  if (!globalForWa.meriendaWa) globalForWa.meriendaWa = createBridge();
  return globalForWa.meriendaWa;
}

export function getSnapshot(): BridgeSnapshot {
  return getBridge().snapshot;
}

function patch(partial: Partial<BridgeSnapshot>) {
  const bridge = getBridge();
  bridge.snapshot = { ...bridge.snapshot, ...partial };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectWhatsApp() {
  const bridge = getBridge();
  if (bridge.snapshot.status === "connected" && bridge.sock) return getSnapshot();
  if (bridge.connecting) return getSnapshot();
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
      lastDisconnect?: { error?: { output?: { statusCode?: number } } };
      qr?: string;
    }) => {
      if (update.qr) {
        const qrDataUrl = await QRCode.toDataURL(update.qr, { margin: 1, width: 280 });
        patch({ status: "qr", qrDataUrl, error: null });
      }
      if (update.connection === "open") {
        const me = sock.user?.id?.split(":")[0] ?? null;
        patch({ status: "connected", qrDataUrl: null, me, error: null });
        bridge.connecting = false;
      }
      if (update.connection === "close") {
        const code = update.lastDisconnect?.error?.output?.statusCode;
        bridge.sock = null;
        bridge.connecting = false;
        if (code === DisconnectReason.loggedOut) {
          patch({
            status: "error",
            qrDataUrl: null,
            me: null,
            error: "WhatsApp cerró la sesión. Volvé a vincular el dispositivo.",
          });
          return;
        }
        if (code === DisconnectReason.restartRequired) {
          void connectWhatsApp();
          return;
        }
        patch({
          status: "error",
          qrDataUrl: null,
          error: "Se cortó WhatsApp. Tocá Vincular de nuevo.",
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
  getBridge().stopRequested = true;
  return getSnapshot();
}

async function resolveVenueJid(sock: WaSock, phone: string): Promise<string | null> {
  for (const digits of venueWhatsAppCandidates(phone)) {
    try {
      const result = await sock.onWhatsApp(whatsappJid(digits));
      const hit = result?.find((item) => item.exists);
      if (hit?.jid) return hit.jid;
    } catch {
      // probar el siguiente formato
    }
  }
  const fallback = toWhatsAppDigits(phone);
  return fallback ? whatsappJid(fallback) : null;
}

export async function sendCampaign(myPhone: string, slugs: string[]) {
  const bridge = getBridge();
  if (bridge.snapshot.status !== "connected" || !bridge.sock) {
    throw new Error("Primero vinculá tu WhatsApp con el código QR.");
  }
  const myDigits = toWhatsAppDigits(myPhone);
  if (!myDigits) throw new Error("Tu número no es válido.");
  if (bridge.snapshot.sending) throw new Error("Ya hay un envío en curso.");

  const targets = places.filter((place) => slugs.includes(place.slug) && place.phone);
  if (!targets.length) throw new Error("No hay locales con teléfono en esta tanda.");

  const sock = bridge.sock;
  const myJid = whatsappJid(myDigits);
  bridge.stopRequested = false;
  const rows: SendRow[] = targets.map((place) => ({
    slug: place.slug,
    name: place.name,
    phase: "pendiente",
  }));
  patch({
    sending: true,
    status: "sending",
    rows,
    current: 0,
    total: targets.length,
    error: null,
  });

  void (async () => {
    try {
      await sock.sendMessage(myJid, { text: campaignStartNote(targets.length) });
      await sleep(SELF_GAP_MS);

      for (const [index, place] of targets.entries()) {
        if (bridge.stopRequested) break;
        const message = outreachMessage(place);
        rows[index] = { ...rows[index], phase: "a-mi" };
        patch({ rows: [...rows], current: index + 1 });
        await sock.sendMessage(myJid, { text: message });
        await sleep(SELF_GAP_MS);
        if (bridge.stopRequested) break;

        rows[index] = { ...rows[index], phase: "al-local" };
        patch({ rows: [...rows] });
        const venueJid = await resolveVenueJid(sock, place.phone as string);
        if (!venueJid) {
          rows[index] = {
            ...rows[index],
            phase: "sin-whatsapp",
            detail: "Ese número no aparece en WhatsApp.",
          };
          patch({ rows: [...rows] });
          continue;
        }
        try {
          await sock.sendMessage(venueJid, { text: message });
          rows[index] = { ...rows[index], phase: "ok", detail: "Salió de tu WhatsApp." };
        } catch (error) {
          rows[index] = {
            ...rows[index],
            phase: "sin-whatsapp",
            detail: error instanceof Error ? error.message : "WhatsApp no aceptó el número.",
          };
        }
        patch({ rows: [...rows] });
        await sleep(VENUE_GAP_MS);
      }
    } catch (error) {
      patch({
        error: error instanceof Error ? error.message : "Falló el envío.",
        status: "connected",
      });
    } finally {
      patch({
        sending: false,
        status: bridge.sock ? "connected" : "error",
        rows: [...rows],
      });
    }
  })();

  return getSnapshot();
}
