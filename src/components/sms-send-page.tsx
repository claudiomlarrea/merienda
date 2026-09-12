"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { SmsQueue } from "@/components/sms-queue";
import { SMS_SENT_KEY, needsSmsOutreach } from "@/lib/outreach";
import { places } from "@/lib/places";

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

export function SmsSendPage() {
  const raw = useSyncExternalStore(subscribe, snapshot, emptySnapshot);
  const smsSent = useMemo(() => {
    try {
      return JSON.parse(raw) as Record<string, boolean>;
    } catch {
      return {} as Record<string, boolean>;
    }
  }, [raw]);

  const pending = useMemo(
    () =>
      [...places]
        .filter((place) => needsSmsOutreach(place) && !smsSent[place.slug])
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [smsSent]
  );

  useEffect(() => {
    // El lote viejo marcaba “listo” solo por abrir iMessage. Eso no se mandó.
    localStorage.removeItem("merienda-sms-auto-done");
  }, []);

  function mark(slug: string) {
    const next = { ...readSmsSent(), [slug]: true };
    localStorage.setItem(SMS_SENT_KEY, JSON.stringify(next));
    emit();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <Link
        href="/campana"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
      >
        <ArrowLeftIcon className="size-4" />
        Volver a la campaña
      </Link>
      <p className="mt-5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Solo vos</p>
      <h1 className="font-heading mt-1 text-3xl sm:text-4xl">SMS desde el Samsung</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">
        Abrir el chat en la Mac no manda nada. Los 24 vuelven a pendientes hasta que el SMS salga
        del chip. Escaneá el código con el teléfono.
      </p>
      <section className="mt-6 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <SmsQueue pending={pending} onMark={mark} />
      </section>
    </div>
  );
}
