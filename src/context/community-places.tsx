"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { Place, Source, Visibility } from "@/lib/types";
import { SOURCES, VISIBILITY } from "@/lib/types";

const KEY = "merienda-sj-community";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return localStorage.getItem(KEY) ?? "[]";
}

function getServerSnapshot() {
  return "[]";
}

type LegacyPlace = Omit<Place, "visibility" | "sources" | "handle"> & {
  visibility?: string;
  sources?: string[];
  handle?: string;
  instagram?: string;
};

function migrateSource(value: string): Source | null {
  if (value === "instagram" || value === "facebook") return "redes";
  return SOURCES.includes(value as Source) ? (value as Source) : null;
}

function migrateVisibility(value?: string): Visibility {
  if (value === "instagram") return "redes";
  return VISIBILITY.includes(value as Visibility) ? (value as Visibility) : "poco-conocido";
}

function migratePlace(raw: LegacyPlace): Place {
  const sources = [...new Set((raw.sources ?? []).map(migrateSource).filter((item): item is Source => Boolean(item)))];
  return {
    ...raw,
    handle: raw.handle ?? raw.instagram,
    visibility: migrateVisibility(raw.visibility),
    sources: sources.length ? sources : ["boca-en-boca"],
  };
}

type CommunityContextValue = {
  extras: Place[];
  add: (place: Place) => void;
};

const CommunityContext = createContext<CommunityContextValue | null>(null);

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const extras = useMemo(() => {
    try {
      return (JSON.parse(raw) as LegacyPlace[]).map(migratePlace);
    } catch {
      return [];
    }
  }, [raw]);

  const add = useCallback((place: Place) => {
    const current = (() => {
      try {
        return (JSON.parse(getSnapshot()) as LegacyPlace[]).map(migratePlace);
      } catch {
        return [] as Place[];
      }
    })();
    const next = [place, ...current.filter((item) => item.slug !== place.slug)];
    localStorage.setItem(KEY, JSON.stringify(next));
    emit();
  }, []);

  const value = useMemo<CommunityContextValue>(() => ({ extras, add }), [extras, add]);

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error("useCommunity must be used within CommunityProvider");
  return ctx;
}
