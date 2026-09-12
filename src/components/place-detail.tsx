import Link from "next/link";
import { AtSignIcon, ExternalLinkIcon, PhoneIcon } from "lucide-react";
import { MapsDirectionsButton } from "@/components/maps-directions-button";
import { PlacePhoto } from "@/components/place-photo";
import { SaveButton } from "@/components/save-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VisibilityBadge } from "@/components/visibility-badge";
import { getDepartment } from "@/lib/departments";
import { departmentShort, kindLabels, placeCocinaTags, cocinaLabels, profileUrl, sourceLabels } from "@/lib/labels";
import type { Place } from "@/lib/types";

export function PlaceDetail({ place }: { place: Place }) {
  const department = getDepartment(place.department);

  return (
    <article className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
      <p className="text-sm text-muted-foreground">
        <Link href="/#explorar" className="hover:underline">
          Lugares
        </Link>
        {" · "}
        <Link href={`/departamentos/${place.department}`} className="hover:underline">
          {departmentShort[place.department]}
        </Link>
      </p>

      <div className="mt-4 overflow-hidden rounded-3xl ring-1 ring-foreground/10">
        <div className="relative aspect-[16/9] min-h-56">
          <PlacePhoto
            src={place.image}
            alt={place.imageAlt}
            sizes="100vw"
            priority
            className="object-cover"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <VisibilityBadge value={place.visibility} />
            <Badge variant="outline">{kindLabels[place.kind]}</Badge>
            {placeCocinaTags(place).map((tag) => (
              <Badge key={tag} variant="secondary">
                {cocinaLabels[tag]}
              </Badge>
            ))}
            {place.community ? <Badge variant="secondary">Sumado por alguien de la guía</Badge> : null}
            {!place.addressConfirmed ? (
              <Badge variant="secondary">Dirección a confirmar</Badge>
            ) : null}
          </div>
          <h1 className="font-heading mt-3 text-3xl leading-tight sm:text-5xl">{place.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {place.locality} · {department?.name}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <SaveButton slug={place.slug} name={place.name} />
          <MapsDirectionsButton
            query={place.mapsQuery}
            name={place.name}
            variant="default"
            size="lg"
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      <p className="mt-6 max-w-3xl text-lg leading-relaxed">{place.blurb}</p>

      <dl className="mt-8 grid gap-6 rounded-2xl bg-card p-5 ring-1 ring-foreground/8 sm:grid-cols-2">
        <div>
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">Dirección</dt>
          <dd className="mt-1 leading-relaxed">{place.address}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">Horarios</dt>
          <dd className="mt-1 leading-relaxed">{place.hours}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">De dónde salió esta ficha</dt>
          <dd className="mt-1">{place.sources.map((source) => sourceLabels[source]).join(" · ")}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">Cómo llegar</dt>
          <dd className="mt-2">
            <MapsDirectionsButton query={place.mapsQuery} name={place.name} size="sm" />
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        {place.handle ? (
          <Button
            render={<a href={profileUrl(place.handle)} target="_blank" rel="noreferrer" />}
            variant="outline"
          >
            <AtSignIcon />
            @{place.handle}
          </Button>
        ) : (
          <span className="stamp rounded-full px-3 py-1 text-[11px] text-muted-foreground">
            Sin perfil en redes
          </span>
        )}
        {place.phone ? (
          <Button render={<a href={`tel:${place.phone}`} />} variant="outline">
            <PhoneIcon />
            {place.phone}
          </Button>
        ) : null}
        <Button render={<Link href="/sumar" />} variant="ghost">
          <ExternalLinkIcon />
          Completar o corregir ficha
        </Button>
      </div>

      <section className="mt-10 max-w-3xl">
        <h2 className="font-heading text-2xl">Por qué está en la guía</h2>
        <p className="mt-3 text-base leading-7 text-pretty">{place.story}</p>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-2xl">Pedí esto</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {place.orderThis.map((item) => (
            <li key={item} className="rounded-full bg-accent px-3 py-1.5 text-sm">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
