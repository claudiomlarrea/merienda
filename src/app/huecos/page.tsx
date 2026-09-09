import Link from "next/link";
import { Button } from "@/components/ui/button";
import { departments } from "@/lib/departments";
import { places } from "@/lib/places";

export const metadata = {
  title: "Huecos",
};

export default function HuecosPage() {
  const coverage = departments
    .map((department) => ({
      ...department,
      count: places.filter((place) => place.department === department.id).length,
    }))
    .sort((a, b) => a.count - b.count);

  const thin = coverage.filter((item) => item.count <= 2);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-heading text-4xl">Cómo encontrar los cafecitos que faltan</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">
        Google lista mal los departamentos. Instagram lista de a uno. Esta guía junta las dos
        cosas y todavía tiene huecos: Chimbas, Santa Lucía, Pocito, Albardón y Sarmiento se
        recorren, no se “googlean”.
      </p>

      <section className="mt-10 space-y-6">
        <h2 className="font-heading text-2xl">Dónde mirar</h2>
        <ol className="list-decimal space-y-4 pl-5 leading-7">
          <li>
            <strong>El recorrido.</strong> Vidriera, cartel escrito a mano, dos mesas al fondo de
            una panadería. En Ullum y Zonda eso vale más que una ficha de Maps.
          </li>
          <li>
            <strong>Instagram por ubicación, no por hashtag turístico.</strong> Abrí el mapa del
            departamento, stories de vecinos, “seguidos por”. Los cafecitos rara vez usan
            #SanJuanTurismo.
          </li>
          <li>
            <strong>Facebook del pueblo.</strong> Grupos de Rodeo, Media Agua, Villa Krause, “se
            vende / se recomienda”. Ahí se entera el horario del sábado.
          </li>
          <li>
            <strong>Turismo y directorios locales.</strong>{" "}
            <a className="underline underline-offset-4" href="https://www.sanjuan.tur.ar/" target="_blank" rel="noreferrer">
              sanjuan.tur.ar
            </a>{" "}
            y{" "}
            <a className="underline underline-offset-4" href="https://sanjuan.geodestinos.ar/site-content/category/206-cafeterias" target="_blank" rel="noreferrer">
              GEOSanJuan
            </a>{" "}
            tienen fichas que Google no muestra primero.
          </li>
          <li>
            <strong>Preguntar en el mostrador.</strong> La panadería de la esquina sabe el café de
            la otra cuadra. Boca en boca sigue siendo el índice de Chimbas.
          </li>
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-2xl">Departamentos con pocas fichas</h2>
        <p className="mt-2 text-muted-foreground">
          Si hay dos o menos, la búsqueda todavía está corta. Ahí hay que volver a caminar o
          sumar un @.
        </p>
        <ul className="mt-6 divide-y rounded-2xl bg-card ring-1 ring-foreground/8">
          {thin.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <Link href={`/departamentos/${item.id}`} className="font-medium hover:underline">
                  {item.name}
                </Link>
                <p className="text-sm text-muted-foreground">{item.region}</p>
              </div>
              <span className="text-sm tabular-nums text-muted-foreground">
                {item.count === 0 ? "Sin fichas" : `${item.count} ${item.count === 1 ? "lugar" : "lugares"}`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-2xl">Cobertura ahora</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {coverage.map((item) => (
            <li key={item.id} className="flex justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
              <Link href={`/departamentos/${item.id}`} className="hover:underline">
                {item.name}
              </Link>
              <span className="tabular-nums text-muted-foreground">{item.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button render={<Link href="/sumar" />} size="lg">
          Sumar un cafecito que viste
        </Button>
        <Button render={<Link href="/lugares?q=cafecito" />} size="lg" variant="outline">
          Buscar “cafecito”
        </Button>
      </div>
    </div>
  );
}
