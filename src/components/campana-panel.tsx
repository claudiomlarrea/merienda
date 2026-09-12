"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CheckIcon, CopyIcon, SendIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { departmentShort, kindLabels } from "@/lib/labels";
import {
  MY_WHATSAPP_KEY,
  OUTREACH_SENT_KEY,
  myWhatsAppUrl,
  selfOutreachMessage,
  toWhatsAppDigits,
} from "@/lib/outreach";
import { places } from "@/lib/places";
import type { Place } from "@/lib/types";

type Filter = "pendientes" | "mandados" | "todos";

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

  const digits = toWhatsAppDigits(savedPhone);
  const ready = Boolean(digits);

  const catalog = useMemo(
    () => [...places].sort((a, b) => a.name.localeCompare(b.name, "es")),
    []
  );

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

  function markSent(slug: string) {
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
    await navigator.clipboard.writeText(selfOutreachMessage(place));
    setCopied(place.slug);
    window.setTimeout(() => setCopied((current) => (current === place.slug ? null : current)), 1800);
  }

  function sendToMe(place: Place) {
    if (!savedPhone) return;
    const url = myWhatsAppUrl(savedPhone, selfOutreachMessage(place));
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    markSent(place.slug);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Solo vos</p>
      <h1 className="font-heading mt-1 text-3xl sm:text-4xl">Mandármelos por WhatsApp</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">
        Merienda no escribe a ningún restorán. Cada toque abre un chat con <strong>tu</strong>{" "}
        número, con el mensaje listo (guía + ficha). Lo mandás y lo reenviás al local desde tu
        cuenta. Si el fijo del local no tiene WhatsApp, no pasa nada: buscás el contacto por el
        nombre.
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
          El celular con el que vas a reenviar. No el del local.
        </p>
        {phoneError ? <p className="mt-2 text-sm text-destructive">{phoneError}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" className="min-h-12">
            Guardar mi número
          </Button>
          {ready ? (
            <p className="text-sm text-muted-foreground">
              Listo. Los mensajes van a +{digits}.
            </p>
          ) : null}
        </div>
      </form>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
            Ya me los mandé ({mandados})
          </FilterChip>
          <FilterChip current={filter} value="todos" onClick={setFilter}>
            Todos ({catalog.length})
          </FilterChip>
        </div>
      </div>

      {!ready ? (
        <p className="mt-8 rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
          Guardá tu WhatsApp arriba. Hasta entonces no se abre ningún chat.
        </p>
      ) : null}

      {ready && visible.length === 0 ? (
        <p className="mt-8 rounded-xl bg-card px-4 py-6 text-sm text-muted-foreground ring-1 ring-foreground/8">
          No hay locales en esta lista. Cambiá el filtro o la búsqueda.
        </p>
      ) : null}

      <ul className="mt-6 space-y-4">
        {visible.map((place) => {
          const mandado = Boolean(sent[place.slug]);
          const url = ready ? myWhatsAppUrl(savedPhone, selfOutreachMessage(place)) : null;
          return (
            <li key={place.slug}>
              <Card className="py-0">
                <CardHeader className="pt-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-xl">{place.name}</CardTitle>
                    {mandado ? <Badge>En tu WhatsApp</Badge> : <Badge variant="outline">Pendiente</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {kindLabels[place.kind]} · {departmentShort[place.department]} · {place.locality}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Reenviar a: </span>
                    {place.phone ?? "sin teléfono en la ficha, buscalo por el nombre"}
                  </p>
                  <Link href={`/lugares/${place.slug}`} className="text-sm underline underline-offset-4">
                    Ver ficha
                  </Link>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    size="lg"
                    className="min-h-12 w-full sm:flex-1"
                    disabled={!url}
                    onClick={() => sendToMe(place)}
                  >
                    <SendIcon />
                    Mandarme este
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="min-h-12 w-full sm:w-auto"
                    onClick={() => void copyMessage(place)}
                  >
                    {copied === place.slug ? <CheckIcon /> : <CopyIcon />}
                    {copied === place.slug ? "Copiado" : "Copiar"}
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
