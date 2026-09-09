"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

const KEY = "merienda-sj-saved";
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

type SavedContextValue = {
  saved: string[];
  toggle: (slug: string) => void;
  has: (slug: string) => boolean;
};

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const saved = useMemo(() => {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }, [raw]);

  const toggle = useCallback((slug: string) => {
    const current = (() => {
      try {
        return JSON.parse(getSnapshot()) as string[];
      } catch {
        return [] as string[];
      }
    })();
    const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
    localStorage.setItem(KEY, JSON.stringify(next));
    emit();
  }, []);

  const value = useMemo<SavedContextValue>(
    () => ({
      saved,
      toggle,
      has: (slug) => saved.includes(slug),
    }),
    [saved, toggle]
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within SavedProvider");
  return ctx;
}
