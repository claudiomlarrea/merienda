"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/lugares", label: "Lugares" },
  { href: "/departamentos", label: "Departamentos" },
  { href: "/huecos", label: "Huecos" },
  { href: "/rutas", label: "Rutas" },
  { href: "/sumar", label: "Sumar un local" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const atHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            render={<Link href="/" />}
            variant={atHome ? "default" : "outline"}
            size="sm"
            aria-current={atHome ? "page" : undefined}
          >
            <HomeIcon />
            Inicio
          </Button>
          <Link href="/" className="flex min-w-0 items-baseline gap-2">
            <span className="font-heading text-xl tracking-tight">Merienda SJ</span>
            <span className="hidden text-xs text-muted-foreground lg:inline">San Juan, Argentina</span>
          </Link>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-accent",
                pathname.startsWith(link.href) && "bg-accent text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button
            render={<Link href="/lugares?visibilidad=instagram" />}
            size="sm"
            variant="ghost"
            className="hidden sm:inline-flex"
          >
            Solo Instagram
          </Button>
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon" className="md:hidden" />}>
              <MenuIcon />
              <span className="sr-only">Abrir menú</span>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Merienda SJ</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4">
                <Link href="/" className="rounded-lg px-2 py-2 text-base hover:bg-accent">
                  Inicio
                </Link>
                {links.map((link) => (
                  <Link key={link.href} href={link.href} className="rounded-lg px-2 py-2 text-base hover:bg-accent">
                    {link.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
