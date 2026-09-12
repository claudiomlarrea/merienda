"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeftIcon, CheckIcon, CopyIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { departmentShort, kindLabels } from "@/lib/labels";
import { OUTREACH_SENT_KEY, outreachMessage } from "@/lib/outreach";
import { places } from "@/lib/places";
import type { Place } from "@/lib/types";

type Filter = "pendientes" | "mandados" | "todos";

type SendRow = {
  slug: string;
  phase: "pendiente" | "a-mi" | "al-local" | "ok" | "sin-whatsapp" | "error";
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
  const [qr, setQr] = useState<{ qrDataUrl: string; textQrDataUrl: string; url: string; text: string } | null>(null);
  const [qrError, setQrError] = useState("");

  const catalog = useMemo(
    () => [...places].sort((a, b) => a.name.localeCompare(b.name, "es")),
    []
  );
  const withPhone = useMemo(() => catalog.filter((place) => place.phone), [catalog]);
  const pendingPlaces = withPhone.filter((place) => !sent[place.slug]);
  const current = pendingPlaces[0] ?? null;

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

  useEffect(() => {
    if (!current) {
      setQr(null);
      return;
    }
    let cancelled = false;
    setQr(null);
    setQrError("");
    async function loadQr() {
      try {
        const response = await fetch(`/api/campana/qr-chat?slug=${encodeURIComponent(current.slug)}`);
        const data = (await response.json()) as {
          qrDataUrl?: string;
          textQrDataUrl?: string;
          url?: string;
          text?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!response.ok || !data.qrDataUrl || !data.textQrDataUrl || !data.text) {
          setQrError(data.error ?? "No se pudo armar el código.");
          return;
        }
        setQr({
          qrDataUrl: data.qrDataUrl,
          textQrDataUrl: data.textQrDataUrl,
          url: data.url ?? "",
          text: data.text,
        });
      } catch {
        if (!cancelled) setQrError("No se pudo armar el código.");
      }
    }
    void loadQr();
    return () => {
      cancelled = true;
    };
  }, [current]);

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
    window.setTimeout(() => setCopied((currentCopied) => (currentCopied === place.slug ? null : currentCopied)), 1800);
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
      <h1 className="font-heading mt-1 text-3xl sm:text-4xl">Seguir mandando</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">
        Quedate en esta pantalla. No entres a merienda-gamma. El cuadrado de abajo no vincula
        WhatsApp: es el chat de ese local.
      </p>

      <section className="mt-6 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <p className="text-sm text-muted-foreground">
          {mandados} ya salieron · {pendingPlaces.length} pendientes
        </p>
        {current ? (
          <>
            <h2 className="font-heading mt-3 text-2xl">{current.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {kindLabels[current.kind]} · {current.locality}
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6">
              <li>Si el chat ya se abrió y está vacío, no hace falta volver a abrir WhatsApp.</li>
              <li>Con la cámara, escaneá el segundo cuadrado (el del texto).</li>
              <li>Tocá Copiar. En el chat, tocá el recuadro de escribir, pegá, Enviar.</li>
            </ol>
            {qr ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-background p-3 ring-1 ring-foreground/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qr.qrDataUrl}
                    alt={`Abrir el chat de ${current.name}`}
                    className="mx-auto size-52 bg-white p-2"
                  />
                  <p className="mt-2 text-center text-sm font-medium">1. Abrir el chat</p>
                </div>
                <div className="rounded-xl bg-background p-3 ring-1 ring-foreground/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qr.textQrDataUrl}
                    alt={`Texto para pegar en el chat de ${current.name}`}
                    className="mx-auto size-52 bg-white p-2"
                  />
                  <p className="mt-2 text-center text-sm font-medium">2. Copiar el texto</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{qrError || "Armando el código…"}</p>
            )}
            <p className="mt-4 text-sm leading-6">
              WhatsApp a veces abre el contacto y no pega el mensaje. Pegalo vos. El texto es este:
            </p>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl bg-background p-4 text-sm leading-6 ring-1 ring-foreground/10">
              {outreachMessage(current)}
            </pre>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button type="button" size="lg" className="min-h-12" onClick={() => mark(current.slug)}>
                Ya lo mandé
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="min-h-12"
                onClick={() => mark(current.slug)}
              >
                Ese número no tiene WhatsApp
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Si abajo dice que no podés iniciar chats nuevos, igual podés escribir en este chat
              porque ya existía: pegá el texto y enviá.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm">No quedan locales con teléfono pendientes.</p>
        )}
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
                        <Badge>Este</Badge>
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
                    ) : !isCurrent ? (
                      <Button
                        type="button"
                        size="lg"
                        variant="ghost"
                        className="min-h-12 w-full sm:w-auto"
                        onClick={() => mark(place.slug)}
                      >
                        Ya lo mandé
                      </Button>
                    ) : null}
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
