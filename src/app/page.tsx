import { Suspense } from "react";
import Link from "next/link";
import { PlacesBrowser } from "@/components/places-browser";
import { Button } from "@/components/ui/button";
import { places } from "@/lib/places";

export default function HomePage() {
  const paraComer = places.filter((place) => place.kind === "restaurante" || place.kind === "comedor").length;
  const departmentsCovered = new Set(places.map((place) => place.department)).size;

  return (
    <div>
      <section className="mx-auto w-full max-w-6xl px-4 pt-10 pb-6 sm:pt-14">
        <p className="stamp inline-block rounded-full px-3 py-1 text-[11px]">San Juan · Argentina</p>
        <h1 className="font-heading mt-5 max-w-3xl text-4xl leading-[1.1] sm:text-6xl">
          Dónde merendar y comer en todo San Juan.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-pretty text-muted-foreground">
          Capital, Rivadavia, Zonda, Ullum y el resto de los departamentos, en una sola guía.
          Cafés, confiterías y restos: los que ya querés y los que solo circulan por redes. La
          idea es sumar, no elegir un barrio.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button render={<a href="#explorar" />} size="lg">
            Comenzar a buscar
          </Button>
          <Button
            render={<Link href="/?momento=comer#explorar" />}
            size="lg"
            variant="outline"
          >
            Dónde comer
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
            <dt className="text-muted-foreground">Para comer</dt>
            <dd className="font-heading text-3xl">{paraComer}</dd>
          </div>
        </dl>
      </section>

      <section
        id="explorar"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-8"
      >
        <h2 className="font-heading text-3xl">Buscá dónde merendar o comer</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Filtrá por merendar o comer, por departamento, o escribí cafecito, almuerzo, facturas.
          Si un departamento está corto,{" "}
          <Link href="/huecos" className="underline underline-offset-4">
            hay que profundizar
          </Link>
          .
        </p>
        <div className="mt-8">
          <Suspense fallback={<p className="text-muted-foreground">Cargando la guía…</p>}>
            <PlacesBrowser />
          </Suspense>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10">
          <p className="text-sm uppercase tracking-[0.18em] opacity-80">La guía</p>
          <h2 className="font-heading mt-2 max-w-2xl text-3xl sm:text-4xl">
            Un mapa para merendar y comer en toda la provincia.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 opacity-90">
            En Capital hay cafés de especialidad, confiterías clásicas y restos de
            circunvalación. En Villa Krause alguien te pasa un @. En Ullum hay un maxikiosco
            que sirve café. Esta guía junta directorios, redes y lo que se ve recorriendo:
            cada local suma.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button render={<Link href="/departamentos/zonda" />} variant="secondary" size="lg">
              Entrar por Zonda
            </Button>
            <Button
              render={<Link href="/sumar" />}
              variant="outline"
              size="lg"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              Sumar un local que viste
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
