import Link from "next/link";
import { PlaceCard } from "@/components/place-card";
import { Button } from "@/components/ui/button";
import { places } from "@/lib/places";

export default function HomePage() {
  const featured = places.filter((place) =>
    ["cafe-haiti", "cinco-uno", "la-coqueta", "edesia-jachal", "punto-encuentro-lm", "don-elizardo"].includes(
      place.slug
    )
  );
  const instagramOnly = places.filter((place) => place.visibility === "instagram").length;
  const departmentsCovered = new Set(places.map((place) => place.department)).size;

  return (
    <div>
      <section className="mx-auto w-full max-w-6xl px-4 pt-10 pb-6 sm:pt-16">
        <p className="stamp inline-block rounded-full px-3 py-1 text-[11px]">San Juan · Argentina</p>
        <h1 className="font-heading mt-5 max-w-3xl text-4xl leading-[1.1] sm:text-6xl">
          Las confiterías que el centro no te muestra.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-pretty text-muted-foreground">
          Recorrimos Zonda, Ullum y otros departamentos lejos de la peatonal. Hay cafés y
          confiterías chicas que solo circulan por Instagram —Café Haití es el ejemplo—. Acá
          están juntas: las conocidas, las de barrio y las que casi no aparecen en Google.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button render={<Link href="/lugares" />} size="lg">
            Ver todos los lugares
          </Button>
          <Button render={<Link href="/lugares?visibilidad=instagram" />} size="lg" variant="outline">
            Empezar por las ocultas
          </Button>
        </div>
        <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Fichas</dt>
            <dd className="font-heading text-3xl">{places.length}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Departamentos</dt>
            <dd className="font-heading text-3xl">{departmentsCovered}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Casi solo redes</dt>
            <dd className="font-heading text-3xl">{instagramOnly}</dd>
          </div>
        </dl>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl">Las que no se conocen</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Instagram, Facebook y el recorrido. No el ranking de la peatonal Tucumán.
            </p>
          </div>
          <Button render={<Link href="/lugares?visibilidad=instagram" />} variant="ghost">
            Ver filtro
          </Button>
        </div>
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((place) => (
            <li key={place.slug}>
              <PlaceCard place={place} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10">
          <p className="text-sm uppercase tracking-[0.18em] opacity-80">El problema</p>
          <h2 className="font-heading mt-2 max-w-2xl text-3xl sm:text-4xl">
            Google lista el centro. El resto de San Juan merienda igual.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 opacity-90">
            En Capital aparecen Clapton, Bonito, Bendito. En Villa Krause alguien te pasa un @.
            En Ullum hay un maxikiosco que sirve café y no tiene ficha. Esta guía junta esas
            tres capas: directorios, redes y lo que se ve yendo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              render={<Link href="/departamentos/zonda" />}
              variant="secondary"
              size="lg"
            >
              Entrar por Zonda
            </Button>
            <Button render={<Link href="/sumar" />} variant="outline" size="lg" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              Sumar un local que viste
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-3">
        <article className="rounded-3xl bg-card p-6 ring-1 ring-foreground/8">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">01</p>
          <h3 className="font-heading mt-2 text-2xl">Instagram y Facebook</h3>
          <p className="mt-3 leading-7 text-muted-foreground">
            Stories, @ de barrio, grupos de Facebook. Ahí viven Cinco Uno, las pastelerías de
            encargue y Café Haití.
          </p>
        </article>
        <article className="rounded-3xl bg-card p-6 ring-1 ring-foreground/8">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">02</p>
          <h3 className="font-heading mt-2 text-2xl">El recorrido</h3>
          <p className="mt-3 leading-7 text-muted-foreground">
            Zonda, Ullum, Calingasta, Jáchal, Iglesia. Un cartel a mano vale más que una ficha de Maps vacía.
          </p>
        </article>
        <article className="rounded-3xl bg-card p-6 ring-1 ring-foreground/8">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">03</p>
          <h3 className="font-heading mt-2 text-2xl">Una sola lista</h3>
          <p className="mt-3 leading-7 text-muted-foreground">
            Mismo formato para La Coqueta y para el local sin dirección confirmada. Lo incompleto también se publica.
          </p>
        </article>
      </section>
    </div>
  );
}
