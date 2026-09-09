"use client";

import { use } from "react";
import Link from "next/link";
import { PlaceDetail } from "@/components/place-detail";
import { Button } from "@/components/ui/button";
import { useCommunity } from "@/context/community-places";
import { getPlace } from "@/lib/places";

export default function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { extras } = useCommunity();
  const place = extras.find((item) => item.slug === slug) ?? getPlace(slug);

  if (!place) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-start gap-4 px-4 py-20">
        <h1 className="font-heading text-3xl">No encontramos ese local</h1>
        <p className="text-muted-foreground">
          Puede haberse movido el enlace. Buscá de nuevo o sumá el local si lo conocés.
        </p>
        <Button render={<Link href="/sumar" />}>Sumar un local</Button>
      </div>
    );
  }

  return <PlaceDetail place={place} />;
}
