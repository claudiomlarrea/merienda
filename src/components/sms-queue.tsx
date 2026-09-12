"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { kindLabels } from "@/lib/labels";
import {
  formatSmsNumber,
  outreachLinkMessage,
  venueCallUrl,
  venueSmsUrl,
  venueSmstoUrl,
} from "@/lib/outreach";
import type { Place } from "@/lib/types";

type QrPayload = {
  smsQrDataUrl: string;
  textQrDataUrl: string;
};

function isAndroid() {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}

export function SmsQueue({
  pending,
  onMark,
}: {
  pending: Place[];
  onMark: (slug: string) => void;
}) {
  const [qr, setQr] = useState<QrPayload | null>(null);
  const [qrError, setQrError] = useState("");
  const [copied, setCopied] = useState<"text" | "phone" | null>(null);
  const [android, setAndroid] = useState(false);
  const current = pending[0] ?? null;
  const smsNumber = current?.phone ? formatSmsNumber(current.phone) : "";

  useEffect(() => {
    setAndroid(isAndroid());
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
        const data = (await response.json()) as QrPayload & { error?: string };
        if (cancelled) return;
        if (!response.ok || !data.smsQrDataUrl || !data.textQrDataUrl) {
          setQrError(data.error ?? "No se pudo armar el código.");
          return;
        }
        setQr({ smsQrDataUrl: data.smsQrDataUrl, textQrDataUrl: data.textQrDataUrl });
      } catch {
        if (!cancelled) setQrError("No se pudo armar el código.");
      }
    }
    void loadQr();
    return () => {
      cancelled = true;
    };
  }, [current]);

  async function copy(kind: "text" | "phone") {
    if (!current) return;
    const value = kind === "text" ? outreachLinkMessage(current) : smsNumber;
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied((now) => (now === kind ? null : now)), 1800);
  }

  if (!current) {
    return (
      <p className="text-sm">
        No quedan locales con teléfono para SMS. Los que ya recibieron WhatsApp no se vuelven a
        mandar.
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {pending.length} pendientes · este es {current.name}
      </p>
      <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950 ring-1 ring-amber-200">
        {android ? (
          <p>
            Tocá <strong>Abrir Mensajes</strong> en este Samsung (globito de SMS, no WhatsApp). Si no
            deja enviar, escaneá el cuadrado 1.
          </p>
        ) : (
          <p>
            Abrir el enlace en la Mac abre <strong>iMessage</strong> y no deja enviar. Eso no cuenta
            como mandado. Escaneá el cuadrado 1 con la <strong>cámara del Samsung</strong>, no con la
            de la Mac.
          </p>
        )}
      </div>
      <h2 className="font-heading mt-5 text-2xl">{current.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {kindLabels[current.kind]} · {current.locality}
      </p>
      <p className="mt-3 font-heading text-2xl tracking-wide">{smsNumber}</p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6">
        <li>Cámara del Samsung al cuadrado 1: se arma el SMS con el número y el texto.</li>
        <li>En el teléfono tocá Enviar.</li>
        <li>Acá, Ya lo mandé: sale el siguiente. No pulses Open en la Mac.</li>
      </ol>
      {qr ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-background p-3 ring-1 ring-foreground/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.smsQrDataUrl} alt={`SMS para ${current.name}`} className="mx-auto size-52 bg-white p-2" />
            <p className="mt-2 text-center text-sm font-medium">1. Abrir el SMS</p>
          </div>
          <div className="rounded-xl bg-background p-3 ring-1 ring-foreground/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr.textQrDataUrl}
              alt={`Texto del SMS para ${current.name}`}
              className="mx-auto size-52 bg-white p-2"
            />
            <p className="mt-2 text-center text-sm font-medium">2. Copiar el texto</p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{qrError || "Armando el código…"}</p>
      )}
      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl bg-background p-4 text-sm leading-6 ring-1 ring-foreground/10">
        {outreachLinkMessage(current)}
      </pre>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {android ? (
          <>
            <Button
              type="button"
              size="lg"
              className="min-h-12"
              onClick={() => {
                const url = venueSmsUrl(current.phone as string, outreachLinkMessage(current));
                if (url) window.location.assign(url);
              }}
            >
              Abrir Mensajes
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="min-h-12"
              onClick={() => {
                const url = venueSmstoUrl(current.phone as string, outreachLinkMessage(current));
                if (url) window.location.assign(url);
              }}
            >
              Probar smsto
            </Button>
          </>
        ) : null}
        <Button type="button" size="lg" className="min-h-12" onClick={() => onMark(current.slug)}>
          Ya lo mandé · siguiente
        </Button>
        <Button type="button" size="lg" variant="outline" className="min-h-12" onClick={() => void copy("text")}>
          {copied === "text" ? <CheckIcon /> : <CopyIcon />}
          {copied === "text" ? "Copiado" : "Copiar texto"}
        </Button>
        <Button type="button" size="lg" variant="outline" className="min-h-12" onClick={() => void copy("phone")}>
          {copied === "phone" ? <CheckIcon /> : <CopyIcon />}
          {copied === "phone" ? "Copiado" : "Copiar número"}
        </Button>
        {current.phone && venueCallUrl(current.phone) ? (
          <Button
            type="button"
            size="lg"
            variant="ghost"
            className="min-h-12"
            onClick={() => {
              const url = venueCallUrl(current.phone as string);
              if (url) window.location.assign(url);
            }}
          >
            Llamar
          </Button>
        ) : null}
        <Button type="button" size="lg" variant="ghost" className="min-h-12" onClick={() => onMark(current.slug)}>
          Este número no recibe SMS
        </Button>
      </div>
    </div>
  );
}
