"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";
import { normalizeUsoPath, shouldCountPath } from "@/lib/uso";

const DOWNLOAD_KEY = "merienda-descarga-contada";

function ping(tipo: "visita" | "descarga", path: string) {
  void fetch("/api/uso", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, path }),
    keepalive: true,
  });
}

export function UsoTracker() {
  const pathname = usePathname();
  const last = useRef("");

  useEffect(() => {
    const page = normalizeUsoPath(pathname || "/");
    if (page === last.current) return;
    last.current = page;
    if (!shouldCountPath(page)) return;
    ping("visita", page);
  }, [pathname]);

  useEffect(() => {
    function markDownload() {
      try {
        if (localStorage.getItem(DOWNLOAD_KEY) === "1") return;
        localStorage.setItem(DOWNLOAD_KEY, "1");
      } catch {
        return;
      }
      ping("descarga", "/");
      track("Descarga");
    }

    function onInstalled() {
      markDownload();
    }

    window.addEventListener("appinstalled", onInstalled);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) markDownload();
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  return null;
}
