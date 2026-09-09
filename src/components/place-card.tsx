import Image from "next/image";
import Link from "next/link";
import { MapsDirectionsButton } from "@/components/maps-directions-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { VisibilityBadge } from "@/components/visibility-badge";
import { departmentShort, kindLabels } from "@/lib/labels";
import type { Place } from "@/lib/types";

export function PlaceCard({ place }: { place: Place }) {
  return (
    <Card className="h-full py-0 ring-foreground/8 transition-shadow hover:ring-foreground/20">
      <Link href={`/lugares/${place.slug}`} className="flex min-h-0 flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={place.image}
            alt={place.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
          <div className="absolute inset-x-3 top-3 flex flex-wrap gap-1.5">
            <VisibilityBadge value={place.visibility} />
            {place.community ? <Badge variant="secondary">Sumado acá</Badge> : null}
          </div>
        </div>
        <CardContent className="flex flex-1 flex-col gap-2 py-4">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {kindLabels[place.kind]} · {departmentShort[place.department]}
          </p>
          <h3 className="font-heading text-xl leading-tight">{place.name}</h3>
          <p className="text-sm text-muted-foreground">{place.locality}</p>
          <p className="mt-auto line-clamp-3 text-sm leading-relaxed">{place.blurb}</p>
        </CardContent>
      </Link>
      <CardFooter className="bg-transparent">
        <MapsDirectionsButton query={place.mapsQuery} name={place.name} size="sm" className="w-full" />
      </CardFooter>
    </Card>
  );
}
