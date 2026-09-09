"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCommunity } from "@/context/community-places";
import { departments } from "@/lib/departments";
import { PLACE_KINDS, type Place, type PlaceKind, type DepartmentId } from "@/lib/types";
import { kindLabels } from "@/lib/labels";

const fallbackImage =
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=80";

export default function SumarPage() {
  const router = useRouter();
  const { add } = useCommunity();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const department = String(data.get("department") ?? "") as DepartmentId;
    const kind = String(data.get("kind") ?? "") as PlaceKind;
    const locality = String(data.get("locality") ?? "").trim();
    const address = String(data.get("address") ?? "").trim();
    const instagram = String(data.get("instagram") ?? "").trim().replace(/^@/, "");
    const story = String(data.get("story") ?? "").trim();

    if (!name || !department || !kind) {
      setError("Hace falta al menos el nombre, el departamento y el tipo.");
      return;
    }

    const slug = slugify(name);
    const place: Place = {
      slug,
      name,
      kind,
      department,
      locality: locality || departments.find((item) => item.id === department)?.name || "",
      address: address || "Ubicación a confirmar — sumada desde Instagram o recorrido.",
      addressConfirmed: Boolean(address),
      hours: String(data.get("hours") ?? "").trim() || "Confirmá por Instagram o Facebook.",
      phone: String(data.get("phone") ?? "").trim() || undefined,
      instagram: instagram || undefined,
      visibility: "instagram",
      sources: instagram ? ["instagram"] : ["recorrido", "boca-en-boca"],
      blurb: story.slice(0, 180) || `Local de ${locality || department} que todavía no estaba en la guía.`,
      story:
        story ||
        "Ficha comunitaria. Falta completar horario o dirección. Si lo encontraste en una story, es exactamente el tipo de lugar que esta guía quiere juntar.",
      orderThis: ["Lo que recomiende quien atiende"],
      tags: ["instagram", "comunitario"],
      image: fallbackImage,
      imageAlt: "Café",
      mapsQuery: `${name} ${locality} San Juan Argentina`,
      community: true,
    };

    add(place);
    setDone(true);
    router.push(`/lugares/${slug}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="font-heading text-4xl">Sumar un local</h1>
      <p className="mt-3 leading-7 text-muted-foreground">
        ¿Viste una confitería en Zonda, un café en Ullum o un @ que no está acá? Cargalo aunque
        falte la calle. Las fichas incompletas son el punto: Café Haití también empezó así.
      </p>

      {error ? (
        <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 grid gap-5">
        <Field label="Nombre del local" htmlFor="name">
          <Input id="name" name="name" required placeholder="Café Haití" className="h-11 bg-card" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Departamento" htmlFor="department">
            <select
              id="department"
              name="department"
              required
              defaultValue="zonda"
              className="h-11 w-full rounded-lg border border-input bg-card px-2.5 text-sm"
            >
              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipo" htmlFor="kind">
            <select
              id="kind"
              name="kind"
              required
              defaultValue="cafe"
              className="h-11 w-full rounded-lg border border-input bg-card px-2.5 text-sm"
            >
              {PLACE_KINDS.map((item) => (
                <option key={item} value={item}>
                  {kindLabels[item]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Localidad o barrio" htmlFor="locality">
          <Input id="locality" name="locality" placeholder="Villa Basilio Nievas" className="h-11 bg-card" />
        </Field>
        <Field label="Dirección (si la sabés)" htmlFor="address">
          <Input id="address" name="address" placeholder="Puede quedar vacío" className="h-11 bg-card" />
        </Field>
        <Field label="Instagram" htmlFor="instagram">
          <Input id="instagram" name="instagram" placeholder="@el_local" className="h-11 bg-card" />
        </Field>
        <Field label="Teléfono" htmlFor="phone">
          <Input id="phone" name="phone" placeholder="264…" className="h-11 bg-card" />
        </Field>
        <Field label="Horarios, si los viste" htmlFor="hours">
          <Input id="hours" name="hours" placeholder="Sábados de tarde, cerró el lunes" className="h-11 bg-card" />
        </Field>
        <Field label="Cómo lo encontraste y qué conviene pedir" htmlFor="story">
          <Textarea
            id="story"
            name="story"
            rows={5}
            placeholder="Una story de una amiga de Ullum. El café con leche y las facturas del sábado."
            className="bg-card"
          />
        </Field>
        <Button type="submit" size="lg" disabled={done}>
          Publicar en la guía
        </Button>
        <p className="text-xs text-muted-foreground">
          Por ahora se guarda en este navegador (prototipo). No borra las fichas del catálogo.
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium" htmlFor={htmlFor}>
      {label}
      {children}
    </label>
  );
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
