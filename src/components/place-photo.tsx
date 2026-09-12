"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export const PLACE_PHOTO_FALLBACK =
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=80";

export function PlacePhoto({
  src,
  alt,
  sizes,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const [current, setCurrent] = useState(src);

  useEffect(() => {
    setCurrent(src);
  }, [src]);

  return (
    <Image
      src={current}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={className}
      onError={() => {
        if (current !== PLACE_PHOTO_FALLBACK) setCurrent(PLACE_PHOTO_FALLBACK);
      }}
    />
  );
}
