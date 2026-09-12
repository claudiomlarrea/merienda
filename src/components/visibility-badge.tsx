import { Badge } from "@/components/ui/badge";
import { visibilityLabels } from "@/lib/labels";
import type { Visibility } from "@/lib/types";
import { cn } from "cn";

/** Fondo opaco y letra oscura: sobre fotos el outline se come el texto. */
const chip =
  "h-auto min-h-6 border-0 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm ring-1 ring-foreground/15";

export function VisibilityBadge({
  value,
  onPhoto = false,
}: {
  value: Visibility;
  onPhoto?: boolean;
}) {
  const surface = onPhoto ? "bg-background" : "bg-card";

  if (value === "redes") {
    return (
      <Badge
        className={cn(
          chip,
          "bg-primary text-primary-foreground ring-primary/30"
        )}
      >
        {visibilityLabels[value]}
      </Badge>
    );
  }

  return (
    <Badge className={cn(chip, surface)}>
      {visibilityLabels[value]}
    </Badge>
  );
}
