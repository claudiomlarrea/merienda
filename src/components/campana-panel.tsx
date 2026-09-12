"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeftIcon, CheckIcon, CopyIcon, MessageCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { departmentShort, kindLabels } from "@/lib/labels";
import {
  OUTREACH_SENT_KEY,
  outreachMessage,
  venueChatUrl,
  venueWhatsAppAppUrl,
} from "@/lib/outreach";
import { getPlace, places } from "@/lib/places";
import type { Place } from "@/lib/types";

type Filter = "pendientes" | "mandados" | "todos";

type SendRow = {
  slug: string;
  phase: "pendiente" | "a-mi" | "al-local" | "ok" | "sin-whatsapp" | "error";
};

const LAST_SEND_KEY = "merienda-sj-last-venue-send";
const GAP_MS = 3 * 60 * 1000;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
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
  return JSON.stringify(readSent());
}

function emptySnapshot() {
  return "{}";
}

function readLastSend() {
  const value = Number(localStorage.getItem(LAST_SEND_KEY) ?? "0");
  return Number.isFinite(value) ? value : 0;
}

function isPhone() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && !/Macintosh|Windows/i.test(navigator.userAgent);
}

function formatWait(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function CampanaPanel() {
  const raw = useSyncExternalStore(subscribe, snapshot, emptySnapshot);
  const sent = useMemo(() => {
    try {
      return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      return {} as Record<string, boolean>;
    }
  }, [raw]);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("pendientes");
  const [copied, setCopied] = useState<string | null>(null);
  const [waiting, setWaiting] = useState<Place | null>(null);
  const [chaining, setChaining] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [lastSend, setLastSend] = useState(0);
  const [onPhone, setOnPhone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const sample = getPlace("la-coqueta") ?? places[0];

  const catalog = useMemo(
    () => [...places].sort((a, b) => a.name.localeCompare(b.name, "es")),
    []
  );
  const withPhone = useMemo(() => catalog.filter((place) => place.phone), [catalog]);
  const pendingPlaces = withPhone.filter((place) => !sent[place.slug]);
  const current = waiting ?? pendingPlaces[0] ?? null;
  const waitLeft = Math.max(0, lastSend + GAP_MS - now);
  const canOpen = waitLeft === 0;

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
    setOnPhone(isPhone());
    setLastSend(readLastSend());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/campana/estado", { cache: "no-store" });
        const data = (await response.json()) as { rows?: SendRow[] };
        if (cancelled || !data.rows?.length) return;
        const next = { ...readSent() };
        let changed = false;
        for (const row of data.rows) {
          if (row.phase === "ok" && !next[row.slug]) {
            next[row.slug] = true;
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem(OUTREACH_SENT_KEY, JSON.stringify(next));
          emit();
        }
      } catch {
        // el servidor se está levantando
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!onPhone || !chaining || waiting || !current || !canOpen) return;
    openVenueChat(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPhone, chaining, waiting, current?.slug, canOpen]);

  function mark(slug: string) {
    const next = { ...readSent(), [slug]: true };
    localStorage.setItem(OUTREACH_SENT_KEY, JSON.stringify(next));
    emit();
  }

  function unmark(slug: string) {
    const next = { ...readSent() };
    delete next[slug];
    localStorage.setItem(OUTREACH_SENT_KEY, JSON.stringify(next));
    emit();
  }

  function stampSend() {
    const at = Date.now();
    localStorage.setItem(LAST_SEND_KEY, String(at));
    setLastSend(at);
    setNow(at);
  }

  function openVenueChat(place: Place) {
    if (!place.phone) return;
    const text = outreachMessage(place);
    const appUrl = venueWhatsAppAppUrl(place.phone, text);
    if (!isPhone()) {
      void copyChatLink(place);
      setWaiting(place);
      return;
    }
    setWaiting(place);
    stampSend();
    if (appUrl) window.location.href = appUrl;
  }

  async function copyChatLink(place: Place) {
    if (!place.phone) return;
    const url = venueChatUrl(place.phone, outreachMessage(place));
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 4000);
  }

  function confirmSent() {
    if (!waiting) return;
    mark(waiting.slug);
    setWaiting(null);
    if (!chaining) return;
    const remaining = pendingPlaces.filter((place) => place.slug !== waiting.slug);
    if (!remaining.length) setChaining(false);
  }

  function skipNoWhatsApp() {
    if (!waiting) return;
    mark(waiting.slug);
    setWaiting(null);
  }

  async function copyMessage(place: Place) {
    await navigator.clipboard.writeText(outreachMessage(place));
    setCopied(place.slug);
    window.setTimeout(() => setCopied((currentCopied) => (currentCopied === place.slug ? null : currentCopied)), 1800);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-32 sm:py-10">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
      >
        <ArrowLeftIcon className="size-4" />
        Volver a Merienda
      </Link>
      <p className="mt-5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Solo vos</p>
      <h1 className="font-heading mt-1 text-3xl sm:text-4xl">Seguir mandando</h1>

      <section className="mt-6 rounded-2xl bg-primary px-4 py-4 text-primary-foreground sm:p-5">
        <h2 className="font-heading text-xl">Esta es la página. No la otra.</h2>
        <p className="mt-2 text-sm leading-6">
          merienda-gamma.vercel.app/campana es la web pública vieja: ahí esta pantalla no existe. No
          vuelvas a esa dirección. Quedate en el Preview de Cursor (127.0.0.1:4567/campana).
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Cerrá la pestaña de merienda-gamma. No hace falta esa web para mandar.</li>
          <li>En Cursor, tocá Preview o el recuadro de la campaña. Tenés que ver “Seguir mandando” y el nombre del próximo local.</li>
          <li>En esta computadora no abras WhatsApp. El botón copia el enlace del chat.</li>
          <li>En el celular, abrí WhatsApp (la app de siempre, sin QR) y pegá ese enlace en un chat con vos mismo, o en Chrome.</li>
          <li>Si WhatsApp todavía tiene el reloj de restricción, no va a dejar el chat nuevo. Cuando llegue a 0, abrí el enlace y tocá Enviar.</li>
        </ol>
      </section>

      <section className="mt-6 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <p className="text-sm text-muted-foreground">
          {mandados} ya salieron · {pendingPlaces.length} con teléfono, pendientes
        </p>
        {current ? (
          <>
            <h2 className="font-heading mt-3 text-2xl">{current.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {kindLabels[current.kind]} · {departmentShort[current.department]} · {current.locality}
            </p>
            <p className="mt-2 text-sm">
              <span className="text-muted-foreground">WhatsApp: </span>
              {current.phone}
            </p>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl bg-background p-4 text-sm leading-6 ring-1 ring-foreground/10">
              {outreachMessage(current)}
            </pre>
            {waiting?.slug === current.slug ? (
              <div className="mt-4 space-y-3">
                {onPhone ? (
                  <p className="text-sm">
                    En WhatsApp tocá <strong>Enviar</strong>. Después volvé y tocá Salió, seguir.
                  </p>
                ) : (
                  <p className="text-sm">
                    {copiedLink ? "Enlace copiado. " : ""}En el celular: Chrome o Safari → pegá en la
                    barra → se abre WhatsApp → Enviar. Acá no abras WhatsApp Web.
                  </p>
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" size="lg" className="min-h-12" onClick={confirmSent}>
                    Salió, seguir
                  </Button>
                  <Button type="button" size="lg" variant="outline" className="min-h-12" onClick={skipNoWhatsApp}>
                    Ese número no tiene WhatsApp
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  size="lg"
                  className="min-h-12"
                  disabled={!canOpen}
                  onClick={() => {
                    setChaining(onPhone);
                    openVenueChat(current);
                  }}
                >
                  <MessageCircleIcon />
                  {canOpen
                    ? onPhone
                      ? `Mandar ${current.name}`
                      : "Copiar enlace para el celular"
                    : `Esperá ${formatWait(waitLeft)}`}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="min-h-12"
                  onClick={() => void copyMessage(current)}
                >
                  {copied === current.slug ? <CheckIcon /> : <CopyIcon />}
                  Copiar texto
                </Button>
              </div>
            )}
            {chaining && waitLeft > 0 && !waiting ? (
              <p className="mt-3 text-sm">
                Siguiente en {formatWait(waitLeft)}. Dejá esta página abierta: se abre solo el
                próximo WhatsApp.
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm">No quedan locales con teléfono pendientes.</p>
        )}
      </section>

      <section className="mt-8 rounded-2xl bg-muted px-4 py-4 text-sm leading-6 sm:p-5">
        <p>
          Si WhatsApp dice que la cuenta está restringida, no es la página: es el reloj de ~24 h.
          En chats que ya existían podés escribir. Los que faltan son chats nuevos; salen con este
          método cuando el reloj llegue a cero. No hace falta escanear nada.
        </p>
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="grid min-w-0 flex-1 gap-2 text-sm font-medium" htmlFor="buscar-campana">
          Buscar local
          <Input
            id="buscar-campana"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Biscuí, Callia, pachata…"
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
        {visible.length ? (
          visible.map((place) => {
            const mandado = Boolean(sent[place.slug]);
            const isCurrent = current?.slug === place.slug;
            return (
              <li key={place.slug}>
                <Card className="py-0">
                  <CardHeader className="pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="text-xl">{place.name}</CardTitle>
                      {mandado ? (
                        <Badge>Enviado</Badge>
                      ) : isCurrent ? (
                        <Badge>Siguiente</Badge>
                      ) : (
                        <Badge variant="outline">Pendiente</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {kindLabels[place.kind]} · {departmentShort[place.department]} · {place.locality}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Contacto: </span>
                      {place.phone ?? "sin teléfono"}
                    </p>
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
                    {!mandado && place.phone ? (
                      <Button
                        type="button"
                        size="lg"
                        className="min-h-12 w-full sm:w-auto"
                        disabled={!canOpen}
                        onClick={() => {
                          setChaining(false);
                          openVenueChat(place);
                        }}
                      >
                        <MessageCircleIcon />
                        {onPhone ? "Mandar este" : "Copiar enlace"}
                      </Button>
                    ) : null}
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
                    ) : (
                      <Button
                        type="button"
                        size="lg"
                        variant="ghost"
                        className="min-h-12 w-full sm:w-auto"
                        onClick={() => mark(place.slug)}
                      >
                        Ya lo mandé
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </li>
            );
          })
        ) : (
          <li className="rounded-2xl bg-card px-4 py-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
            No hay locales en este filtro.
          </li>
        )}
      </ul>

      {current ? (
        <div
          className="fixed inset-x-0 bottom-16 z-40 border-t border-border/80 bg-background/95 p-3 backdrop-blur-md md:bottom-0"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex w-full max-w-3xl">
            {waiting?.slug === current.slug ? (
              <Button type="button" size="lg" className="min-h-12 w-full" onClick={confirmSent}>
                Salió, seguir
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className="min-h-12 w-full"
                disabled={!canOpen}
                onClick={() => {
                  setChaining(onPhone);
                  openVenueChat(current);
                }}
              >
                <MessageCircleIcon />
                {canOpen
                  ? onPhone
                    ? `Mandar ${current.name}`
                    : "Copiar enlace para el celular"
                  : `Esperá ${formatWait(waitLeft)}`}
              </Button>
            )}
          </div>
        </div>
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
