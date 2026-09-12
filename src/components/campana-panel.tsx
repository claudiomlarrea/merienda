"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeftIcon, CheckIcon, CopyIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { departmentShort, kindLabels } from "@/lib/labels";
import {
  MY_WHATSAPP_KEY,
  OUTREACH_SENT_KEY,
  outreachMessage,
  toWhatsAppDigits,
} from "@/lib/outreach";
import { getPlace, places } from "@/lib/places";
import type { Place } from "@/lib/types";

type Filter = "pendientes" | "mandados" | "todos";

type SendRow = {
  slug: string;
  name: string;
  phase: "pendiente" | "a-mi" | "al-local" | "ok" | "sin-whatsapp" | "error";
  detail?: string;
};

type BridgeSnapshot = {
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

const emptyBridge: BridgeSnapshot = {
  status: "idle",
  qrDataUrl: null,
  me: null,
  error: null,
  sending: false,
  current: 0,
  total: 0,
  lastBeat: 0,
  rows: [],
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readMyPhone() {
  return localStorage.getItem(MY_WHATSAPP_KEY) ?? "";
}

function readSent(): Record<string, boolean> {
  try {
    const raw = JSON.parse(localStorage.getItem(OUTREACH_SENT_KEY) ?? "{}") as Record<string, boolean | number>;
    return Object.fromEntries(Object.keys(raw).map((slug) => [slug, true]));
  } catch {
    return {};
  }
}

function snapshot() {
  return JSON.stringify({ phone: readMyPhone(), sent: readSent() });
}

function emptySnapshot() {
  return JSON.stringify({ phone: "", sent: {} });
}

const phaseLabel: Record<SendRow["phase"], string> = {
  pendiente: "En espera",
  "a-mi": "Llegando a tu chat",
  "al-local": "Saliendo al local",
  ok: "Enviado al local",
  "sin-whatsapp": "Ese número no tiene WhatsApp",
  error: "Se trabó, se sigue",
};

export function CampanaPanel() {
  const raw = useSyncExternalStore(subscribe, snapshot, emptySnapshot);
  const { phone: savedPhone, sent } = useMemo(() => {
    try {
      const parsed = JSON.parse(raw) as { phone?: string; sent?: Record<string, boolean> };
      return { phone: parsed.phone ?? "", sent: parsed.sent ?? {} };
    } catch {
      return { phone: "", sent: {} as Record<string, boolean> };
    }
  }, [raw]);

  const [draft, setDraft] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const phoneValue = editingPhone ? draft : savedPhone;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("pendientes");
  const [copied, setCopied] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const [bridge, setBridge] = useState<BridgeSnapshot>(emptyBridge);
  const [busy, setBusy] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const autoQr = useRef(false);

  const digits = toWhatsAppDigits(savedPhone);
  const ready = Boolean(digits);
  const sample = getPlace("la-coqueta") ?? places[0];

  const catalog = useMemo(
    () => [...places].sort((a, b) => a.name.localeCompare(b.name, "es")),
    []
  );
  const withPhone = useMemo(() => catalog.filter((place) => place.phone), [catalog]);
  const pendingSlugs = withPhone.filter((place) => !sent[place.slug]).map((place) => place.slug);
  const leftover =
    !bridge.sending &&
    bridge.rows.some(
      (row) =>
        row.phase === "pendiente" ||
        row.phase === "a-mi" ||
        row.phase === "al-local" ||
        row.phase === "error"
    );
  const stuck = Boolean(
    (bridge.sending && bridge.lastBeat > 0 && now - bridge.lastBeat > 18000) ||
      bridge.rows.some((row) => row.phase === "a-mi" && !bridge.sending)
  );
  const resumeFromLocal = !bridge.sending && Object.keys(sent).length > 0 && pendingSlugs.length > 0;
  const showContinuar = stuck || leftover || resumeFromLocal;
  const continueSlugs = [
    ...new Set([
      ...pendingSlugs,
      ...bridge.rows
        .filter((row) => row.phase !== "ok" && row.phase !== "sin-whatsapp")
        .map((row) => row.slug),
    ]),
  ];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((place) => {
      const mandado = Boolean(sent[place.slug]);
      if (filter === "pendientes" && mandado) return false;
      if (filter === "mandados" && !mandado) return false;
      if (!q) return true;
      const haystack = `${place.name} ${place.locality} ${place.phone ?? ""} ${kindLabels[place.kind]}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [catalog, filter, query, sent]);

  const pendientes = catalog.filter((place) => !sent[place.slug]).length;
  const mandados = catalog.length - pendientes;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const response = await fetch("/api/campana/estado", { cache: "no-store" });
        const data = (await response.json()) as BridgeSnapshot;
        if (!cancelled) setBridge(data);
      } catch {
        // el servidor se está levantando
      }
    }
    void tick();
    const id = window.setInterval(() => void tick(), 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!bridge.rows.length) return;
    const next = { ...readSent() };
    let changed = false;
    for (const row of bridge.rows) {
      if (row.phase === "ok" && !next[row.slug]) {
        next[row.slug] = true;
        changed = true;
      }
      if (row.phase !== "ok" && row.phase !== "sin-whatsapp" && next[row.slug]) {
        delete next[row.slug];
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(OUTREACH_SENT_KEY, JSON.stringify(next));
      emit();
    }
  }, [bridge.rows]);

  useEffect(() => {
    if (bridge.status === "error" && !bridge.qrDataUrl && !autoQr.current) {
      autoQr.current = true;
      void conectar(true);
    }
    if (bridge.status === "qr" || bridge.status === "connected") {
      autoQr.current = false;
    }
  }, [bridge.status, bridge.qrDataUrl]);

  function savePhone(event: React.FormEvent) {
    event.preventDefault();
    const next = toWhatsAppDigits(phoneValue);
    if (!next) {
      setPhoneError("Poné tu celular con código de área. Ejemplo: 264 555 1234.");
      return;
    }
    setPhoneError("");
    localStorage.setItem(MY_WHATSAPP_KEY, phoneValue.trim());
    setEditingPhone(false);
    emit();
  }

  function unmark(slug: string) {
    const next = { ...readSent() };
    delete next[slug];
    localStorage.setItem(OUTREACH_SENT_KEY, JSON.stringify(next));
    emit();
  }

  async function copyMessage(place: Place) {
    await navigator.clipboard.writeText(outreachMessage(place));
    setCopied(place.slug);
    window.setTimeout(() => setCopied((current) => (current === place.slug ? null : current)), 1800);
  }

  async function conectar(reset = false) {
    setBusy("conectar");
    try {
      await fetch("/api/campana/conectar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: reset || bridge.status === "error" }),
      });
    } finally {
      setBusy("");
    }
  }

  async function enviarTodos(force = false) {
    if (!savedPhone) return;
    const slugs = force ? continueSlugs : pendingSlugs;
    if (!slugs.length) return;
    if (!force) {
      const ok = window.confirm(
        `Se van a mandar ${slugs.length} mensajes desde TU WhatsApp. Cada local recibe el texto de Claudio Larrea con su ficha. ¿Seguimos?`
      );
      if (!ok) return;
    }
    setBusy("enviar");
    try {
      if (force) {
        await fetch("/api/campana/parar", { method: "POST" });
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      const response = await fetch("/api/campana/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          myPhone: savedPhone,
          slugs,
          force,
          alreadySent: Object.keys(sent),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        window.alert(data.error ?? "No se pudo empezar el envío.");
      }
    } finally {
      setBusy("");
    }
  }

  async function parar() {
    await fetch("/api/campana/parar", { method: "POST" });
  }

  async function desconectar() {
    await fetch("/api/campana/desconectar", { method: "POST" });
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-32 sm:py-10 sm:pb-32">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
      >
        <ArrowLeftIcon className="size-4" />
        Volver a Merienda
      </Link>
      <p className="mt-5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Solo vos</p>
      <h1 className="font-heading mt-1 text-3xl sm:text-4xl">Enviar desde mi WhatsApp</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">
        Vinculás tu WhatsApp como un dispositivo. El texto de <strong>Claudio Larrea</strong> sale
        de tu cuenta a cada local, con su ficha. Si se traba a mitad de camino, tocá Continuar: los
        que ya salieron no se vuelven a mandar.
      </p>

      <form
        onSubmit={savePhone}
        className="mt-8 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5"
      >
        <label className="grid gap-2 text-sm font-medium" htmlFor="mi-whatsapp">
          Tu WhatsApp
          <Input
            id="mi-whatsapp"
            inputMode="tel"
            autoComplete="tel"
            placeholder="264 155 1234"
            value={phoneValue}
            onChange={(event) => {
              setEditingPhone(true);
              setDraft(event.target.value);
            }}
            className="h-12 bg-background text-base"
          />
        </label>
        <p className="mt-2 text-sm text-muted-foreground">
          El celular de Claudio, el mismo de la app de WhatsApp.
        </p>
        {phoneError ? <p className="mt-2 text-sm text-destructive">{phoneError}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" className="min-h-12">
            Guardar mi número
          </Button>
          {ready ? <p className="text-sm text-muted-foreground">Listo: +{digits}</p> : null}
        </div>
      </form>

      <section className="mt-8 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <h2 className="font-heading text-xl">1. Vincular tu WhatsApp</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          En el teléfono: WhatsApp → Dispositivos vinculados → Vincular un dispositivo. Escaneá el
          código de acá. Si dice que se cerró la sesión, no pasa nada: volvé a escanear y después
          Continuar. Los que ya salieron no se mandan de nuevo.
        </p>
        {bridge.status === "error" ? (
          <p className="mt-3 rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground">
            Hay que volver a vincular el WhatsApp. El código aparece solo; si no, tocá el botón y
            escaneá. Después, Continuar desde Isalú.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="lg"
            className="min-h-12"
            onClick={() => void conectar(bridge.status === "error")}
            disabled={busy === "conectar" || bridge.status === "connected"}
          >
            {bridge.status === "connected"
              ? "Vinculado"
              : bridge.status === "error"
                ? "Volver a mostrar el código"
                : "Mostrar código QR"}
          </Button>
          {bridge.status === "connected" ? (
            <Button type="button" size="lg" variant="outline" className="min-h-12" onClick={() => void desconectar()}>
              Desvincular
            </Button>
          ) : null}
        </div>
        {(bridge.status === "qr" || busy === "conectar") && !bridge.qrDataUrl ? (
          <p className="mt-4 text-sm text-muted-foreground">Generando el código…</p>
        ) : null}
        {bridge.qrDataUrl ? (
          <div className="mt-4 rounded-xl bg-background p-3 ring-1 ring-foreground/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bridge.qrDataUrl} alt="Código QR para vincular WhatsApp" className="mx-auto size-56" />
            <p className="mt-2 text-center text-sm text-muted-foreground">Escaneá con el teléfono.</p>
          </div>
        ) : null}
        {bridge.status === "connected" ? (
          <p className="mt-4 text-sm">WhatsApp conectado{bridge.me ? ` · ${bridge.me}` : ""}.</p>
        ) : null}
        {bridge.error ? <p className="mt-3 text-sm text-destructive">{bridge.error}</p> : null}
      </section>

      <section id="continuar" className="mt-8 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <h2 className="font-heading text-xl">2. Enviar a todos los locales</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {pendingSlugs.length} con teléfono, pendientes. El botón grande de abajo arranca el envío.
          Los que ya salieron no se vuelven a mandar.
        </p>
        {stuck ? (
          <p className="mt-3 rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground">
            Se trabó. Tocá Continuar: Isalú y el resto se reintentan; los que ya salieron no se tocan.
          </p>
        ) : showContinuar ? (
          <p className="mt-3 rounded-xl bg-muted px-4 py-3 text-sm">
            Hay envíos hechos y otros pendientes. Continuar sigue desde el próximo, sin repetir La
            Coqueta ni los que ya figuran enviados.
          </p>
        ) : null}
        <SendActions
          showContinuar={showContinuar}
          ready={ready}
          busy={busy}
          connected={bridge.status === "connected" || bridge.status === "sending"}
          sending={bridge.sending}
          stuck={stuck}
          pendingCount={pendingSlugs.length}
          onEnviar={() => void enviarTodos(showContinuar)}
          onParar={() => void parar()}
        />
        {bridge.sending || bridge.rows.length ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {bridge.current} de {bridge.total}
          </p>
        ) : null}
        {bridge.rows.length ? (
          <ul className="mt-4 divide-y rounded-xl bg-background ring-1 ring-foreground/10">
            {bridge.rows.map((row) => (
              <li key={row.slug} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                <span>{row.name}</span>
                <span className="text-right text-muted-foreground">
                  {phaseLabel[row.phase]}
                  {row.detail ? ` · ${row.detail}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="mt-8 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <h2 className="font-heading text-xl">3. El texto exacto, por empresa</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Cambia solo la ficha. Así se ve, por ejemplo, para {sample?.name}:
        </p>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl bg-background p-4 text-sm leading-6 ring-1 ring-foreground/10">
          {sample ? outreachMessage(sample) : ""}
        </pre>
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="grid min-w-0 flex-1 gap-2 text-sm font-medium" htmlFor="buscar-campana">
          Buscar local
          <Input
            id="buscar-campana"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="La Coqueta, Edesia, pachata…"
            className="h-12 bg-card"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <FilterChip current={filter} value="pendientes" onClick={setFilter}>
            Pendientes ({pendientes})
          </FilterChip>
          <FilterChip current={filter} value="mandados" onClick={setFilter}>
            Ya salieron ({mandados})
          </FilterChip>
          <FilterChip current={filter} value="todos" onClick={setFilter}>
            Todos ({catalog.length})
          </FilterChip>
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {visible.map((place) => {
          const mandado = Boolean(sent[place.slug]);
          const row = bridge.rows.find((item) => item.slug === place.slug);
          return (
            <li key={place.slug}>
              <Card className="py-0">
                <CardHeader className="pt-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-xl">{place.name}</CardTitle>
                    {mandado ? <Badge>Enviado</Badge> : <Badge variant="outline">Pendiente</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {kindLabels[place.kind]} · {departmentShort[place.department]} · {place.locality}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Contacto: </span>
                    {place.phone ?? "sin teléfono — no entra en el envío masivo"}
                  </p>
                  {row ? <p className="text-muted-foreground">{phaseLabel[row.phase]}</p> : null}
                  <Link href={`/lugares/${place.slug}`} className="text-sm underline underline-offset-4">
                    Ver ficha
                  </Link>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="min-h-12 w-full sm:w-auto"
                    onClick={() => void copyMessage(place)}
                  >
                    {copied === place.slug ? <CheckIcon /> : <CopyIcon />}
                    {copied === place.slug ? "Copiado" : "Copiar texto"}
                  </Button>
                  {mandado ? (
                    <Button
                      type="button"
                      size="lg"
                      variant="ghost"
                      className="min-h-12 w-full sm:w-auto"
                      onClick={() => unmark(place.slug)}
                    >
                      Todavía no
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border/80 bg-background/95 p-3 backdrop-blur-md md:bottom-0" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground sm:flex-1">
            {bridge.status !== "connected" && !bridge.sending
              ? "Primero vinculá el WhatsApp arriba. Después sale el envío."
              : bridge.sending
                ? `Enviando ${bridge.current} de ${bridge.total}.`
                : `${pendingSlugs.length} pendientes. Los que ya salieron no se tocan.`}
          </p>
          <SendActions
            showContinuar={showContinuar}
            ready={ready}
            busy={busy}
            connected={bridge.status === "connected" || bridge.status === "sending"}
            sending={bridge.sending}
            stuck={stuck}
            pendingCount={pendingSlugs.length}
            fullWidth
            onEnviar={() => void enviarTodos(showContinuar)}
            onParar={() => void parar()}
          />
        </div>
      </div>
    </div>
  );
}

function SendActions({
  showContinuar,
  ready,
  busy,
  connected,
  sending,
  stuck,
  pendingCount,
  fullWidth,
  onEnviar,
  onParar,
}: {
  showContinuar: boolean;
  ready: boolean;
  busy: string;
  connected: boolean;
  sending: boolean;
  stuck: boolean;
  pendingCount: number;
  fullWidth?: boolean;
  onEnviar: () => void;
  onParar: () => void;
}) {
  return (
    <div className={fullWidth ? "flex w-full flex-wrap gap-2 sm:w-auto" : "mt-4 flex flex-wrap gap-2"}>
      {showContinuar ? (
        <Button
          type="button"
          size="lg"
          className={fullWidth ? "min-h-12 flex-1 sm:min-w-56" : "min-h-12"}
          disabled={!ready || busy === "enviar" || !connected || (sending && !stuck)}
          onClick={onEnviar}
        >
          Continuar desde acá
        </Button>
      ) : (
        <Button
          type="button"
          size="lg"
          className={fullWidth ? "min-h-12 flex-1 sm:min-w-56" : "min-h-12"}
          disabled={!ready || !connected || !pendingCount || busy === "enviar"}
          onClick={onEnviar}
        >
          Enviar a todos desde mi WhatsApp
        </Button>
      )}
      {sending ? (
        <Button type="button" size="lg" variant="outline" className="min-h-12" onClick={onParar}>
          Parar
        </Button>
      ) : null}
    </div>
  );
}

function FilterChip({
  current,
  value,
  onClick,
  children,
}: {
  current: Filter;
  value: Filter;
  onClick: (value: Filter) => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={current === value ? "default" : "outline"}
      size="sm"
      className="min-h-10"
      onClick={() => onClick(value)}
    >
      {children}
    </Button>
  );
}
