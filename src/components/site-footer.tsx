import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-border/80 bg-card/60 md:mt-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between md:py-10">
        <div>
          <p className="font-heading text-lg">Merienda</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Una guía armada desde recorridos por Zonda, Ullum y otros departamentos, más fichas de
            redes, Maps y boca en boca. Cafés para merendar, pachatas y restos para almorzar. Los
            horarios de pueblo cambian: confirmá antes de cruzar el dique.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/" className="hover:underline">
            Inicio
          </Link>
          <Link href="/lugares" className="hover:underline">
            Lugares
          </Link>
          <Link href="/que-falta" className="hover:underline">
            Qué falta
          </Link>
          <Link href="/sumar" className="hover:underline">
            Sumar un local
          </Link>
          <Link href="/rutas" className="hover:underline">
            Rutas
          </Link>
        </div>
      </div>
    </footer>
  );
}
