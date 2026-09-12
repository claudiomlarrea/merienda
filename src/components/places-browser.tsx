"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { PlaceCard } from "@/components/place-card";
import { Button } from "@/components/ui/button";
import { departments } from "@/lib/departments";
import { cocinaLabels, kindLabels, momentLabels, normalizeVisibilityFilter, visibilityLabels } from "@/lib/labels";
import { type PlacesBrowserQuery } from "@/lib/browser-query";
import { places as catalog } from "@/lib/places";
import { filterPlaces } from "@/lib/search";
import { COCINA_TAGS, MOMENTS, PLACE_KINDS, VISIBILITY, type Place } from "@/lib/types";
import { useCommunity } from "@/context/community-places";
import { useSaved } from "@/context/saved-places";
import { cn } from "@/lib/utils";

const emptyCopy: Record<string, { title: string; body: string }> = {
  search: {
    title: "Nada con esa búsqueda",
    body: "Probá otro nombre, un departamento o un tipo: pachatas, cafés, bodegas, helado.",
  },
  filter: {
    title: "No hay lugares con ese filtro",
    body: "Probá sacando un filtro o cambiando de departamento.",
  },
};

const PAGE_SIZE = 18;

const SEARCH_HINTS = [
  "pachatas",
  "cafés",
  "vinoteca",
  "bodegas",
  "helado",
  "sushi",
  "parrilla",
  "vegano",
  "sin tacc",
  "herboristería",
];

type Filters = {
  department: string;
  kind: string;
  moment: string;
  visibility: string;
  cocina: string;
  onlySaved: boolean;
};

function filtersFromQuery(query: PlacesBrowserQuery | undefined, lockedDepartment?: string): Filters {
  return {
    department: lockedDepartment ?? query?.depto ?? "",
    kind: query?.tipo ?? "",
    moment: query?.momento ?? "",
    visibility: normalizeVisibilityFilter(query?.visibilidad ?? ""),
    cocina: query?.cocina ?? "",
    onlySaved: query?.guardados === "1",
  };
}

export function PlacesBrowser({
  initialDepartment,
  initialQuery,
}: {
  initialDepartment?: string;
  initialQuery?: PlacesBrowserQuery;
}) {
  const { extras } = useCommunity();
  const { saved } = useSaved();

  const [q, setQ] = useState(initialQuery?.q ?? "");
  const [filters, setFilters] = useState<Filters>(() =>
    filtersFromQuery(initialQuery, initialDepartment)
  );
  const [shown, setShown] = useState(PAGE_SIZE);
  const deferredQ = useDeferredValue(q);

  const all = useMemo(() => [...extras, ...catalog], [extras]);

  const filtered = useMemo(
    () =>
      filterPlaces(all, {
        q: deferredQ,
        department: filters.department,
        kind: filters.kind,
        moment: filters.moment,
        visibility: filters.visibility,
        cocina: filters.cocina,
        onlySaved: filters.onlySaved,
        saved,
      }),
    [all, deferredQ, filters, saved]
  );

  useEffect(() => {
    setShown(PAGE_SIZE);
  }, [deferredQ, filters]);

  const visible = filtered.slice(0, shown);
  const searching = deferredQ.trim().length > 0;

  function patchFilters(patch: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="space-y-6">
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label className="text-sm font-medium" htmlFor="buscar">
          Buscar
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id="buscar"
            name="q"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Pachatas, cafés, vinoteca, bodegas…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            className="h-12 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button type="submit" size="lg" className="min-h-12 sm:h-12">
            Buscar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Escribí y se filtra solo. La búsqueda ignora tildes y no recarga la página.
        </p>
        <div className="flex flex-wrap gap-2">
          {SEARCH_HINTS.map((term) => (
            <button
              key={term}
              type="button"
              className="min-h-11 rounded-full border border-border bg-card px-3.5 py-2 text-sm hover:bg-accent"
              onClick={() => setQ(term)}
            >
              {term}
            </button>
          ))}
        </div>
      </form>

      <div className="flex flex-col gap-4">
        {!initialDepartment ? (
          <FilterRow label="Departamento">
            <Chip active={!filters.department} onClick={() => patchFilters({ department: "" })}>
              Todos
            </Chip>
            {departments.map((item) => (
              <Chip
                key={item.id}
                active={filters.department === item.id}
                onClick={() => patchFilters({ department: item.id })}
              >
                {item.name}
              </Chip>
            ))}
          </FilterRow>
        ) : null}

        <FilterRow label="Para">
          <Chip active={!filters.moment} onClick={() => patchFilters({ moment: "" })}>
            Todos
          </Chip>
          {MOMENTS.map((item) => (
            <Chip
              key={item}
              active={filters.moment === item}
              onClick={() => patchFilters({ moment: item })}
            >
              {momentLabels[item]}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Tipo">
          <Chip active={!filters.kind} onClick={() => patchFilters({ kind: "" })}>
            Todos
          </Chip>
          {PLACE_KINDS.map((item) => (
            <Chip
              key={item}
              active={filters.kind === item}
              onClick={() => patchFilters({ kind: item })}
            >
              {kindLabels[item]}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Cocina">
          <Chip active={!filters.cocina} onClick={() => patchFilters({ cocina: "" })}>
            Todas
          </Chip>
          {COCINA_TAGS.map((item) => (
            <Chip
              key={item}
              active={filters.cocina === item}
              onClick={() => patchFilters({ cocina: item })}
            >
              {cocinaLabels[item]}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Qué tan conocido">
          <Chip active={!filters.visibility} onClick={() => patchFilters({ visibility: "" })}>
            Todos
          </Chip>
          {VISIBILITY.map((item) => (
            <Chip
              key={item}
              active={filters.visibility === item}
              onClick={() => patchFilters({ visibility: item })}
            >
              {visibilityLabels[item]}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Lista">
          <Chip active={!filters.onlySaved} onClick={() => patchFilters({ onlySaved: false })}>
            Todos
          </Chip>
          <Chip active={filters.onlySaved} onClick={() => patchFilters({ onlySaved: true })}>
            Guardados ({saved.length})
          </Chip>
        </FilterRow>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          copy={searching ? emptyCopy.search : emptyCopy.filter}
          savedEmpty={filters.onlySaved && saved.length === 0}
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "lugar" : "lugares"}
          </p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((place) => (
              <li key={place.slug}>
                <PlaceCard place={place} />
              </li>
            ))}
          </ul>
          {shown < filtered.length ? (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="min-h-12 w-full"
              onClick={() => setShown((count) => count + PAGE_SIZE)}
            >
              Ver más lugares ({filtered.length - shown} quedan)
            </Button>
          ) : null}
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
        "min-h-11 rounded-full border px-3.5 py-2 text-sm transition-colors",
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
