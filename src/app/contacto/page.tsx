"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_EMAIL, CONTACT_NAME, contactoMailto } from "@/lib/contacto";

export default function ContactoPage() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const nombre = String(data.get("nombre") ?? "").trim();
    const respuesta = String(data.get("respuesta") ?? "").trim();
    const mensaje = String(data.get("mensaje") ?? "").trim();
    if (!mensaje) {
      setError("Escribí el comentario.");
      return;
    }
    window.location.href = contactoMailto({ nombre, respuesta, mensaje });
    setSent(true);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <h1 className="font-heading text-3xl sm:text-4xl">Contacto</h1>
      <p className="mt-3 leading-7 text-muted-foreground">
        ¿Una ficha está mal, falta un local o querés decir algo de la guía? Escribile a{" "}
        {CONTACT_NAME}. El mensaje sale por tu correo, hacia{" "}
        <a className="font-medium text-foreground underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      {error ? (
        <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}
      {sent ? (
        <p className="mt-6 rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10">
          Se abrió tu correo con el texto listo. Tocá enviar. Si no se abrió, usá el mail de arriba.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 grid gap-5">
        <label className="grid gap-2 text-sm font-medium" htmlFor="nombre">
          Tu nombre
          <Input id="nombre" name="nombre" placeholder="Cómo firmás" className="h-11 bg-card" />
        </label>
        <label className="grid gap-2 text-sm font-medium" htmlFor="respuesta">
          Mail o teléfono, si querés respuesta
          <Input
            id="respuesta"
            name="respuesta"
            placeholder="tu@mail.com o 264…"
            className="h-11 bg-card"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium" htmlFor="mensaje">
          Comentario
          <Textarea
            id="mensaje"
            name="mensaje"
            required
            rows={7}
            placeholder="El horario de tal confitería cambió, falta un comedor en Angaco, la app se traba al buscar…"
            className="bg-card"
          />
        </label>
        <Button type="submit" size="lg" className="min-h-12">
          Enviar comentario
        </Button>
      </form>
    </div>
  );
}
