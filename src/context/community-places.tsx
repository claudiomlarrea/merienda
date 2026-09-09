"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { Place } from "@/lib/types";

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

type CommunityContextValue = {
  extras: Place[];
  add: (place: Place) => void;
};

const CommunityContext = createContext<CommunityContextValue | null>(null);

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const extras = useMemo(() => {
    try {
      return JSON.parse(raw) as Place[];
    } catch {
      return [];
    }
  }, [raw]);

  const add = useCallback((place: Place) => {
    const current = (() => {
      try {
        return JSON.parse(getSnapshot()) as Place[];
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
