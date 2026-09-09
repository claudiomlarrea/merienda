"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlaceCard } from "@/components/place-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { departments } from "@/lib/departments";
import { cocinaLabels, kindLabels, matchesMoment, momentLabels, normalizeVisibilityFilter, visibilityLabels } from "@/lib/labels";
import { places as catalog } from "@/lib/places";
import { matchesPlaceQuery } from "@/lib/search";
import { COCINA_TAGS, MOMENTS, PLACE_KINDS, VISIBILITY, type Place } from "@/lib/types";
import { useCommunity } from "@/context/community-places";
import { useSaved } from "@/context/saved-places";
import { cn } from "@/lib/utils";

const emptyCopy: Record<string, { title: string; body: string }> = {
  search: {
    title: "Nada con esa búsqueda",
    body: "Probá el departamento (Jáchal, 25 de Mayo) o “herboristería”. Si sigue sin aparecer, es un hueco: sumalo.",
  },
  filter: {
    title: "No hay fichas con ese filtro",
    body: "Zonda y Ullum todavía tienen pocos locales indexados. Si conocés uno, la guía se arma así.",
  },
};

export function PlacesBrowser({
  initialDepartment,
}: {
  initialDepartment?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { extras } = useCommunity();
  const { saved } = useSaved();

  const department = initialDepartment ?? searchParams.get("depto") ?? "";
  const kind = searchParams.get("tipo") ?? "";
  const moment = searchParams.get("momento") ?? "";
  const visibility = normalizeVisibilityFilter(searchParams.get("visibilidad") ?? "");
  const cocina = searchParams.get("cocina") ?? "";
  const onlySaved = searchParams.get("guardados") === "1";
  const qParam = searchParams.get("q") ?? "";
  const [q, setQ] = useState(qParam);

  const all = useMemo(() => [...extras, ...catalog], [extras]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const filtered = useMemo(() => {
    const query = q.trim();
    return all.filter((place) => {
      if (department && place.department !== department) return false;
      if (kind && place.kind !== kind) return false;
      if (moment && !matchesMoment(place, moment)) return false;
      if (visibility && place.visibility !== visibility) return false;
      if (cocina && !place.tags.includes(cocina)) return false;
      if (onlySaved && !saved.includes(place.slug)) return false;
      if (!query) return true;
      return matchesPlaceQuery(place, query);
    });
  }, [all, department, kind, moment, visibility, cocina, onlySaved, saved, q]);

  return (
    <div className="space-y-6">
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setParam("q", q);
        }}
      >
        <label className="text-sm font-medium" htmlFor="buscar">
          Buscar
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id="buscar"
            value={q}
            onValueChange={(value: string) => setQ(value)}
            placeholder="Helado, sushi, parrilla, vegano, sin tacc…"
            className="h-11 bg-card text-base"
          />
          <Button type="submit" size="lg" className="sm:h-11">
            Buscar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Busca al escribir. Ignora tildes. Entiende “helado”, “parrilla”, “vegano”, “sin tacc” y “herboristería”.
        </p>
        <div className="flex flex-wrap gap-2">
          {["helado", "sushi", "parrilla", "vegano", "sin tacc", "herboristería"].map((term) => (
            <button
              key={term}
              type="button"
              className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-accent"
              onClick={() => {
                setQ(term);
                setParam("q", term);
              }}
            >
              {term}
            </button>
          ))}
        </div>
      </form>

      <div className="flex flex-col gap-4">
        {!initialDepartment ? (
          <FilterRow label="Departamento">
            <Chip active={!department} onClick={() => setParam("depto", "")}>
              Todos
            </Chip>
            {departments.map((item) => (
              <Chip
                key={item.id}
                active={department === item.id}
                onClick={() => setParam("depto", item.id)}
              >
                {item.name}
              </Chip>
            ))}
          </FilterRow>
        ) : null}

        <FilterRow label="Para">
          <Chip active={!moment} onClick={() => setParam("momento", "")}>
            Todos
          </Chip>
          {MOMENTS.map((item) => (
            <Chip
              key={item}
              active={moment === item}
              onClick={() => setParam("momento", item)}
            >
              {momentLabels[item]}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Tipo">
          <Chip active={!kind} onClick={() => setParam("tipo", "")}>
            Todos
          </Chip>
          {PLACE_KINDS.map((item) => (
            <Chip key={item} active={kind === item} onClick={() => setParam("tipo", item)}>
              {kindLabels[item]}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Cocina">
          <Chip active={!cocina} onClick={() => setParam("cocina", "")}>
            Todas
          </Chip>
          {COCINA_TAGS.map((item) => (
            <Chip
              key={item}
              active={cocina === item}
              onClick={() => setParam("cocina", item)}
            >
              {cocinaLabels[item]}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Qué tan conocido">
          <Chip active={!visibility} onClick={() => setParam("visibilidad", "")}>
            Todos
          </Chip>
          {VISIBILITY.map((item) => (
            <Chip
              key={item}
              active={visibility === item}
              onClick={() => setParam("visibilidad", item)}
            >
              {visibilityLabels[item]}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Lista">
          <Chip active={!onlySaved} onClick={() => setParam("guardados", "")}>
            Todos
          </Chip>
          <Chip active={onlySaved} onClick={() => setParam("guardados", "1")}>
            Guardados ({saved.length})
          </Chip>
        </FilterRow>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          copy={qParam ? emptyCopy.search : emptyCopy.filter}
          savedEmpty={onlySaved && saved.length === 0}
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "lugar" : "lugares"}
          </p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((place) => (
              <li key={place.slug}>
                <PlaceCard place={place} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({
  copy,
  savedEmpty,
}: {
  copy: { title: string; body: string };
  savedEmpty?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-card/70 px-6 py-16 text-center">
      <p className="font-heading text-2xl">
        {savedEmpty ? "Todavía no guardaste ningún lugar" : copy.title}
      </p>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        {savedEmpty
          ? "Marcá una confitería con Guardar para armar tu propia ruta de merienda."
          : copy.body}
      </p>
      {!savedEmpty ? (
        <Button render={<Link href="/sumar" />} className="mt-6">
          Sumar un local
        </Button>
      ) : null}
    </div>
  );
}

export function mergePlaces(extras: Place[], catalogPlaces: Place[] = catalog) {
  return [...extras, ...catalogPlaces];
}
