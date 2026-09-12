"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeftIcon, CheckIcon, CopyIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SmsQueue } from "@/components/sms-queue";
import { departmentShort, kindLabels } from "@/lib/labels";
import {
  SMS_CRED_KEY,
  SMS_SENT_KEY,
  WHATSAPP_ALREADY_SENT,
  needsSmsOutreach,
  outreachMessage,
} from "@/lib/outreach";
import { places } from "@/lib/places";
import type { Place } from "@/lib/types";

type Filter = "pendientes" | "whatsapp" | "sms" | "sin-telefono" | "todos";

type SmsCred = {
  httpSmsKey: string;
  fromPhone: string;
  twilioSid: string;
  twilioToken: string;
  twilioFrom: string;
};

const emptyCred: SmsCred = {
  httpSmsKey: "",
  fromPhone: "",
  twilioSid: "",
  twilioToken: "",
  twilioFrom: "",
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readSmsSent(): Record<string, boolean> {
  try {
    const raw = JSON.parse(localStorage.getItem(SMS_SENT_KEY) ?? "{}") as Record<string, boolean | number>;
    return Object.fromEntries(Object.keys(raw).map((slug) => [slug, true]));
  } catch {
    return {};
  }
}

function snapshot() {
  return JSON.stringify(readSmsSent());
}

function emptySnapshot() {
  return "{}";
}

function readCred(): SmsCred {
  try {
    const raw = JSON.parse(localStorage.getItem(SMS_CRED_KEY) ?? "{}") as Partial<SmsCred>;
    return { ...emptyCred, ...raw };
  } catch {
    return emptyCred;
  }
}

function placeStatus(place: Place, smsSent: Record<string, boolean>) {
  if (WHATSAPP_ALREADY_SENT.has(place.slug)) return "whatsapp" as const;
  if (smsSent[place.slug]) return "sms" as const;
  if (!place.phone) return "sin-telefono" as const;
  return "pendiente" as const;
}

export function CampanaPanel() {
  const raw = useSyncExternalStore(subscribe, snapshot, emptySnapshot);
  const smsSent = useMemo(() => {
    try {
      return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      return {} as Record<string, boolean>;
    }
  }, [raw]);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("pendientes");
  const [copied, setCopied] = useState<string | null>(null);
  const [cred, setCred] = useState<SmsCred>(emptyCred);
  const [loteLog, setLoteLog] = useState("");
  const [loteBusy, setLoteBusy] = useState(false);
  const [loteError, setLoteError] = useState("");
  const stopRef = useRef(false);

  const catalog = useMemo(
    () => [...places].sort((a, b) => a.name.localeCompare(b.name, "es")),
    []
  );
  const pendingPlaces = catalog.filter((place) => needsSmsOutreach(place) && !smsSent[place.slug]);
  const current = pendingPlaces[0] ?? null;
  const waCount = catalog.filter((place) => WHATSAPP_ALREADY_SENT.has(place.slug)).length;
  const smsCount = catalog.filter((place) => smsSent[place.slug] && !WHATSAPP_ALREADY_SENT.has(place.slug)).length;
  const noPhoneCount = catalog.filter((place) => !place.phone && !WHATSAPP_ALREADY_SENT.has(place.slug)).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((place) => {
      const status = placeStatus(place, smsSent);
      if (filter !== "todos" && status !== filter) return false;
      if (!q) return true;
      const haystack = `${place.name} ${place.locality} ${place.phone ?? ""} ${kindLabels[place.kind]}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [catalog, filter, query, smsSent]);

  useEffect(() => {
    setCred(readCred());
    localStorage.removeItem("merienda-sms-auto-done");
  }, []);

  function mark(slug: string) {
    const next = { ...readSmsSent(), [slug]: true };
    localStorage.setItem(SMS_SENT_KEY, JSON.stringify(next));
    emit();
  }

  function unmark(slug: string) {
    const next = { ...readSmsSent() };
    delete next[slug];
    localStorage.setItem(SMS_SENT_KEY, JSON.stringify(next));
    emit();
  }

  function saveCred(next: SmsCred) {
    setCred(next);
    localStorage.setItem(SMS_CRED_KEY, JSON.stringify(next));
  }

  async function copyMessage(place: Place) {
    await navigator.clipboard.writeText(outreachMessage(place));
    setCopied(place.slug);
    window.setTimeout(() => setCopied((currentCopied) => (currentCopied === place.slug ? null : currentCopied)), 1800);
  }

  async function sendAllGateway() {
    const queue = pendingPlaces.map((place) => place.slug);
    if (!queue.length) return;
    stopRef.current = false;
    setLoteBusy(true);
    setLoteError("");
    setLoteLog(`Empiezo ${queue.length} SMS…`);
    let ok = 0;
    let fail = 0;
    let lastError = "";
    for (const slug of queue) {
      if (stopRef.current) break;
      const place = catalog.find((item) => item.slug === slug);
      setLoteLog(`Mandando ${place?.name ?? slug}… (${ok + fail + 1} de ${queue.length})`);
      try {
        const response = await fetch("/api/campana/sms-lote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs: [slug], ...cred }),
        });
        const data = (await response.json()) as {
          needsProvider?: boolean;
          error?: string;
          rows?: { ok: boolean; detail: string; name: string }[];
        };
        if (data.needsProvider) {
          lastError = data.error ?? "Falta HttpSMS o Twilio.";
          setLoteError(lastError);
          break;
        }
        const row = data.rows?.[0];
        if (!response.ok || !row?.ok) {
          fail += 1;
          lastError = row?.detail || data.error || "Ese SMS no salió.";
          setLoteError(lastError);
          break;
        }
        mark(slug);
        ok += 1;
        setLoteLog(`${ok} salieron · ${fail} no. Último: ${row.name}.`);
      } catch {
        fail += 1;
        lastError = "No se pudo hablar con el servidor.";
        setLoteError(lastError);
        break;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 1600));
    }
    setLoteBusy(false);
    if (stopRef.current) {
      setLoteLog(`Pausado. ${ok} salieron.`);
    } else if (!lastError) {
      setLoteLog(`Listo. Salieron ${ok}.`);
    }
  }

  const hasGateway = Boolean(
    (cred.httpSmsKey.trim() && cred.fromPhone.trim()) ||
      (cred.twilioSid.trim() && cred.twilioToken.trim() && cred.twilioFrom.trim())
  );

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
      <h1 className="font-heading mt-1 text-3xl sm:text-4xl">SMS desde el Samsung</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">
        En la Mac se abre iMessage y no deja enviar: eso no mandó nada. Escaneá el código con el
        Samsung. Quedan <strong>{pendingPlaces.length} con teléfono</strong>. Los {waCount} de
        WhatsApp no se repiten. Los {noPhoneCount} sin número no se pueden SMS.
      </p>

      <section className="mt-6 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <p className="text-sm text-muted-foreground">
          {pendingPlaces.length} pendientes de SMS · {waCount} ya por WhatsApp · {smsCount} ya por
          SMS · {noPhoneCount} sin teléfono
        </p>

        {pendingPlaces.length ? (
          <>
            <div className="mt-4">
              <SmsQueue pending={pendingPlaces} onMark={mark} />
            </div>
            <details className="mt-5 rounded-xl bg-background p-4 ring-1 ring-foreground/10">
              <summary className="cursor-pointer text-sm font-medium">
                Mandarlos solos desde acá (HttpSMS o Twilio)
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                HttpSMS en el Samsung usa tu chip y manda de verdad, sin iMessage. Twilio sale con
                otro número, salvo que tengas sender propio. Las claves quedan en este navegador.
              </p>
              <div className="mt-3 grid gap-3">
                <label className="grid gap-1 text-sm font-medium">
                  Clave HttpSMS
                  <Input
                    value={cred.httpSmsKey}
                    onChange={(event) => saveCred({ ...cred, httpSmsKey: event.target.value })}
                    autoComplete="off"
                    className="h-11"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Tu número (el del chip)
                  <Input
                    value={cred.fromPhone}
                    onChange={(event) => saveCred({ ...cred, fromPhone: event.target.value })}
                    placeholder="+54 9 264…"
                    className="h-11"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Twilio SID
                  <Input
                    value={cred.twilioSid}
                    onChange={(event) => saveCred({ ...cred, twilioSid: event.target.value })}
                    autoComplete="off"
                    className="h-11"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Twilio token
                  <Input
                    type="password"
                    value={cred.twilioToken}
                    onChange={(event) => saveCred({ ...cred, twilioToken: event.target.value })}
                    autoComplete="off"
                    className="h-11"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Twilio From
                  <Input
                    value={cred.twilioFrom}
                    onChange={(event) => saveCred({ ...cred, twilioFrom: event.target.value })}
                    placeholder="+1…"
                    className="h-11"
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  size="lg"
                  className="min-h-12"
                  disabled={!hasGateway || loteBusy}
                  onClick={() => void sendAllGateway()}
                >
                  {loteBusy ? "Mandando…" : `Enviar los ${pendingPlaces.length} ahora`}
                </Button>
                {loteBusy ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="min-h-12"
                    onClick={() => {
                      stopRef.current = true;
                    }}
                  >
                    Pausar
                  </Button>
                ) : null}
              </div>
              {loteLog ? <p className="mt-3 text-sm">{loteLog}</p> : null}
              {loteError ? <p className="mt-2 text-sm text-destructive">{loteError}</p> : null}
            </details>
          </>
        ) : (
          <p className="mt-3 text-sm">
            No quedan locales con teléfono para SMS. Los que ya recibieron WhatsApp no se vuelven a
            mandar.
          </p>
        )}
      </section>

      <div className="mt-10 flex flex-col gap-3">
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
            Pendientes ({pendingPlaces.length})
          </FilterChip>
          <FilterChip current={filter} value="whatsapp" onClick={setFilter}>
            WhatsApp ({waCount})
          </FilterChip>
          <FilterChip current={filter} value="sms" onClick={setFilter}>
            SMS ({smsCount})
          </FilterChip>
          <FilterChip current={filter} value="sin-telefono" onClick={setFilter}>
            Sin teléfono ({noPhoneCount})
          </FilterChip>
          <FilterChip current={filter} value="todos" onClick={setFilter}>
            Todos ({catalog.length})
          </FilterChip>
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {visible.length ? (
          visible.map((place) => {
            const status = placeStatus(place, smsSent);
            const isCurrent = current?.slug === place.slug;
            return (
              <li key={place.slug}>
                <Card className="py-0">
                  <CardHeader className="pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="text-xl">{place.name}</CardTitle>
                      {status === "whatsapp" ? (
                        <Badge>WhatsApp</Badge>
                      ) : status === "sms" ? (
                        <Badge>SMS</Badge>
                      ) : status === "sin-telefono" ? (
                        <Badge variant="outline">Sin teléfono</Badge>
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
                    {status === "sms" ? (
                      <Button
                        type="button"
                        size="lg"
                        variant="ghost"
                        className="min-h-12 w-full sm:w-auto"
                        onClick={() => unmark(place.slug)}
                      >
                        Todavía no
                      </Button>
                    ) : status === "pendiente" && !isCurrent ? (
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
