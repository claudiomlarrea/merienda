"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, MapIcon, PlusIcon, UtensilsCrossedIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Inicio", icon: HomeIcon, match: (path: string) => path === "/" },
  {
    href: "/lugares",
    label: "Lugares",
    icon: UtensilsCrossedIcon,
    match: (path: string) => path.startsWith("/lugares") || path.startsWith("/huecos") || path.startsWith("/rutas"),
  },
  {
    href: "/departamentos",
    label: "Departamentos",
    icon: MapIcon,
    match: (path: string) => path.startsWith("/departamentos"),
  },
  {
    href: "/sumar",
    label: "Sumar",
    icon: PlusIcon,
    match: (path: string) => path.startsWith("/sumar"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
