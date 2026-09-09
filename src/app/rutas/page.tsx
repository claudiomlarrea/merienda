import Link from "next/link";
import { PlaceCard } from "@/components/place-card";
import { getPlace, meriendaRoutes } from "@/lib/places";

export const metadata = {
  title: "Rutas",
};

export default function RutasPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="font-heading text-4xl">Rutas de merienda</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        No es un tour operador: son tardes armadas para no volver al centro a sentarte. Confirmá
        horarios: en departamento se cierra sin aviso.
      </p>
      <div className="mt-10 space-y-14">
        {meriendaRoutes.map((route) => {
          const stops = route.placeSlugs.map((slug) => getPlace(slug)).filter(Boolean);
          return (
            <section key={route.slug}>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                {route.duration} · {route.km}
              </p>
              <h2 className="font-heading mt-1 text-3xl">{route.title}</h2>
              <p className="text-muted-foreground">{route.subtitle}</p>
              <p className="mt-3 max-w-2xl leading-7">{route.why}</p>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {stops.map((place) =>
                  place ? (
                    <li key={place.slug}>
                      <PlaceCard place={place} />
                    </li>
                  ) : null
                )}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="mt-12 text-sm text-muted-foreground">
        ¿Armaste otra ruta?{" "}
        <Link href="/sumar" className="underline underline-offset-4">
          Sumá los locales que faltan
        </Link>
        .
      </p>
    </div>
  );
}
