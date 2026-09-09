"use client";

import { BookmarkIcon, BookmarkCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSaved } from "@/context/saved-places";

export function SaveButton({ slug, name }: { slug: string; name: string }) {
  const { has, toggle } = useSaved();
  const saved = has(slug);

  return (
    <Button
      type="button"
      variant={saved ? "default" : "outline"}
      size="sm"
      onClick={() => toggle(slug)}
      aria-pressed={saved}
      aria-label={saved ? `Sacar ${name} de guardados` : `Guardar ${name}`}
    >
      {saved ? <BookmarkCheckIcon /> : <BookmarkIcon />}
      {saved ? "Guardado" : "Guardar"}
    </Button>
  );
}
