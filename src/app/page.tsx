import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlacesBrowser } from "@/components/places-browser";
import { Button } from "@/components/ui/button";
import { places } from "@/lib/places";

export default function HomePage() {
  const paraComer = places.filter((place) =>
    ["restaurante", "comedor", "pizzeria", "empanadas", "vinoteca"].includes(place.kind)
  ).length;
  const departmentsCovered = new Set(places.map((place) => place.department)).size;

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/fondo-agua-verde.jpg"
            alt="Río y álamos verdes de San Juan, con el cerro seco al fondo"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_40%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/62 to-background" />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-8 pb-8 sm:pt-14 sm:pb-10">
          <p className="stamp inline-block rounded-full bg-background/70 px-3 py-1 text-[11px] backdrop-blur-sm">
            San Juan · Argentina
          </p>
          <h1 className="font-heading mt-5 max-w-3xl text-[2rem] leading-[1.12] sm:text-6xl">
            Dónde merendar y comer en los 19 departamentos.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-pretty sm:mt-5 sm:text-lg sm:leading-8">
            Capital, Rivadavia, Zonda, Ullum y el resto de los departamentos, en una sola guía.
            Albardón, Angaco, Calingasta, Jáchal, Iglesia, Caucete, Valle Fértil, Sarmiento, 25 de
            Mayo: restoranes, pizzerías, pachatas, heladerías y herboristerías que el Maps de
            Capital no encuentra. La idea es sumar, no elegir un barrio.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            <Button render={<a href="#explorar" />} size="lg" className="min-h-12 w-full sm:w-auto">
              Comenzar a buscar
            </Button>
            <Button
              render={<Link href="/?momento=comer#explorar" />}
              size="lg"
              variant="outline"
              className="min-h-12 w-full border-foreground/20 bg-background/70 sm:w-auto"
            >
              Dónde comer
            </Button>
          </div>
          <dl className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm sm:mt-10 sm:gap-4">
            <div>
              <dt className="text-muted-foreground">Fichas</dt>
              <dd className="font-heading text-2xl sm:text-3xl">{places.length}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Departamentos</dt>
              <dd className="font-heading text-2xl sm:text-3xl">{departmentsCovered}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Para comer</dt>
              <dd className="font-heading text-2xl sm:text-3xl">{paraComer}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        id="explorar"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-6 sm:py-8"
      >
        <h2 className="font-heading text-2xl sm:text-3xl">Buscá dónde merendar o comer</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Filtrá por merendar o comer, por departamento (los 19) o por cocina. Si Angaco o 9 de
          Julio están cortos,{" "}
          <Link href="/huecos" className="underline underline-offset-4">
            hay que profundizar
          </Link>
          .
        </p>
        <div className="mt-6 sm:mt-8">
          <Suspense fallback={<p className="text-muted-foreground">Cargando la guía…</p>}>
            <PlacesBrowser />
          </Suspense>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <div className="rounded-3xl bg-primary px-5 py-8 text-primary-foreground sm:px-10 sm:py-10">
          <p className="text-sm uppercase tracking-[0.18em] opacity-80">La guía</p>
          <h2 className="font-heading mt-2 max-w-2xl text-2xl sm:text-4xl">
            Un mapa para merendar y comer en toda la provincia.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 opacity-90">
            En Capital hay cafés de especialidad, confiterías clásicas y restos de
            circunvalación. En Villa Krause alguien te pasa un @. En Ullum hay un maxikiosco
            que sirve café. Esta guía junta directorios, redes y lo que se ve recorriendo:
            cada local suma.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button render={<Link href="/departamentos/zonda" />} variant="secondary" size="lg" className="min-h-12 w-full sm:w-auto">
              Entrar por Zonda
            </Button>
            <Button
              render={<Link href="/sumar" />}
              variant="outline"
              size="lg"
              className="min-h-12 w-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
            >
              Sumar un local que viste
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
