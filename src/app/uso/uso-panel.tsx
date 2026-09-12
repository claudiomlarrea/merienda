"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { emptyUso, type UsoState } from "@/lib/uso";

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-AR").format(value);
}

function formatWhen(iso: string | null) {
  if (!iso) return "Todavía no hay movimientos.";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function UsoPanel() {
  const [data, setData] = useState<UsoState>(emptyUso);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/uso", { cache: "no-store" });
      if (!response.ok) throw new Error("No se pudo leer el contador.");
      setData((await response.json()) as UsoState);
    } catch {
      setError("No se pudo leer el contador.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, []);

  const topPages = Object.entries(data.paginas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

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
      <h1 className="font-heading mt-1 text-3xl sm:text-4xl">¿La están usando?</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">
        Visitas a la guía, gente distinta y cuántos la bajaron a la pantalla de inicio. La campaña
        SMS no entra en estas cuentas.
      </p>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Visitas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-4xl">{loading ? "…" : formatNumber(data.visitas)}</p>
            <p className="mt-2 text-sm text-muted-foreground">Páginas abiertas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Visitantes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-4xl">{loading ? "…" : formatNumber(data.visitantes)}</p>
            <p className="mt-2 text-sm text-muted-foreground">Celulares o computadoras distintas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Descargas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-4xl">{loading ? "…" : formatNumber(data.descargas)}</p>
            <p className="mt-2 text-sm text-muted-foreground">La agregaron a la pantalla de inicio</p>
          </CardContent>
        </Card>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">Actualizado: {formatWhen(data.actualizado)}</p>
      <Button type="button" size="lg" variant="outline" className="mt-3 min-h-11" onClick={() => void load()}>
        Actualizar ahora
      </Button>

      <section className="mt-10">
        <h2 className="font-heading text-2xl">Páginas que más abren</h2>
        {topPages.length ? (
          <ol className="mt-4 space-y-2">
            {topPages.map(([path, count]) => (
              <li key={path} className="flex items-baseline justify-between gap-4 text-sm">
                <span className="truncate">{path}</span>
                <span className="font-medium tabular-nums">{formatNumber(count)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Todavía no hay páginas contadas.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-2xl">Últimos movimientos</h2>
        {data.eventos.length ? (
          <ul className="mt-4 space-y-2 text-sm">
            {data.eventos.map((evento, index) => (
              <li key={`${evento.t}-${index}`} className="flex flex-wrap gap-x-3 text-muted-foreground">
                <span>{formatWhen(evento.t)}</span>
                <span>{evento.tipo === "descarga" ? "Descarga" : "Visita"}</span>
                <span className="text-foreground">{evento.path}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Cuando alguien entre, aparece acá.</p>
        )}
      </section>

      <p className="mt-10 text-sm leading-6 text-muted-foreground">
        En Vercel, en el proyecto de merienda-gamma, activá <strong>Web Analytics</strong>. Ahí
        quedan visitas y visitantes aunque se redeploye la app. Las descargas también salen como
        evento <strong>Descarga</strong>. Esta pantalla es tuya: no está en el menú.
      </p>
    </div>
  );
}
