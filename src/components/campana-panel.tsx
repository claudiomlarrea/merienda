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

const DAILY_CAP = 8;

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
  const [opened, setOpened] = useState<string | null>(null);
  const sample = getPlace("la-coqueta") ?? places[0];

  const catalog = useMemo(
    () => [...places].sort((a, b) => a.name.localeCompare(b.name, "es")),
    []
  );
  const withPhone = useMemo(() => catalog.filter((place) => place.phone), [catalog]);
  const pendingPlaces = withPhone.filter((place) => !sent[place.slug]);
  const todaysBatch = pendingPlaces.slice(0, DAILY_CAP);
  const todaysSlugs = new Set(todaysBatch.map((place) => place.slug));

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

  async function copyMessage(place: Place) {
    await navigator.clipboard.writeText(outreachMessage(place));
    setCopied(place.slug);
    window.setTimeout(() => setCopied((current) => (current === place.slug ? null : current)), 1800);
  }

  function openVenueChat(place: Place) {
    if (!place.phone) return;
    const url = venueChatUrl(place.phone, outreachMessage(place));
    if (!url) return;
    setOpened(place.slug);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
      >
        <ArrowLeftIcon className="size-4" />
        Volver a Merienda
      </Link>
      <p className="mt-5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Solo vos</p>
      <h1 className="font-heading mt-1 text-3xl sm:text-4xl">Enviar desde mi WhatsApp</h1>

      <section className="mt-6 rounded-2xl bg-primary px-4 py-4 text-primary-foreground sm:p-5">
        <h2 className="font-heading text-xl">WhatsApp frenó la cuenta</h2>
        <p className="mt-2 text-sm leading-6">
          No hace falta escanear el QR. WhatsApp vio muchos chats nuevos seguidos y restringió la
          cuenta unas 24 horas: podés hablar en chats que ya existen, pero no abrir otros ni
          vincular un dispositivo.
        </p>
        <p className="mt-2 text-sm leading-6">
          El envío automático quedó parado. Cuando el reloj de WhatsApp llegue a cero, mandá de a{" "}
          {DAILY_CAP} por día, a mano, desde esta lista. Si apurás de nuevo, te vuelve a bloquear.
        </p>
        <p className="mt-3 text-sm font-medium">
          Ya salieron {mandados}. Quedan {pendingPlaces.length} con teléfono.
        </p>
      </section>

      <section className="mt-8 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <h2 className="font-heading text-xl">Cuando se levante, de a poco</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Un local, copiá o abrí el chat, mandá, marcá Enviado. Esperá un rato y pasá al siguiente.
          Hoy, como mucho estos {todaysBatch.length || DAILY_CAP}:
        </p>
        {todaysBatch.length ? (
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
            {todaysBatch.map((place) => (
              <li key={place.slug}>
                <span className="font-medium">{place.name}</span>
                <span className="text-muted-foreground"> · {place.locality}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm">No quedan locales con teléfono pendientes.</p>
        )}
      </section>

      <section className="mt-8 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <h2 className="font-heading text-xl">El texto, por empresa</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Firmás Claudio Larrea. Cambia solo la ficha. Ejemplo para {sample?.name}:
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
        {visible.length ? (
          visible.map((place) => {
            const mandado = Boolean(sent[place.slug]);
            const chatUrl = place.phone ? venueChatUrl(place.phone, outreachMessage(place)) : null;
            const today = todaysSlugs.has(place.slug);
            return (
              <li key={place.slug}>
                <Card className="py-0">
                  <CardHeader className="pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="text-xl">{place.name}</CardTitle>
                      {mandado ? (
                        <Badge>Enviado</Badge>
                      ) : today ? (
                        <Badge>Hoy, cuando se levante</Badge>
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
                      {place.phone ?? "sin teléfono — no entra en el envío"}
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
                    {chatUrl && !mandado ? (
                      <Button
                        type="button"
                        size="lg"
                        className="min-h-12 w-full sm:w-auto"
                        onClick={() => openVenueChat(place)}
                      >
                        <MessageCircleIcon />
                        {opened === place.slug ? "Abierto" : "Abrir chat"}
                      </Button>
                    ) : null}
                    {!mandado ? (
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="min-h-12 w-full sm:w-auto"
                        onClick={() => mark(place.slug)}
                      >
                        Ya lo mandé
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="lg"
                        variant="ghost"
                        className="min-h-12 w-full sm:w-auto"
                        onClick={() => unmark(place.slug)}
                      >
                        Todavía no
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
