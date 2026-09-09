import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/80 bg-card/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-heading text-lg">Merienda SJ</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Una guía armada desde recorridos por Zonda, Ullum y otros departamentos, más fichas de Instagram,
            Facebook y boca en boca. Los horarios de pueblo cambian: confirmá por redes.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/" className="hover:underline">
            Inicio
          </Link>
          <Link href="/lugares" className="hover:underline">
            Lugares
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
