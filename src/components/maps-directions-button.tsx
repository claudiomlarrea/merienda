import { NavigationIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mapsDirectionsUrl } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function MapsDirectionsButton({
  query,
  name,
  variant = "outline",
  size = "default",
  className,
}: {
  query: string;
  name: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  return (
    <Button
      render={
        <a
          href={mapsDirectionsUrl(query)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Cómo llegar a ${name} en Google Maps`}
        />
      }
      variant={variant}
      size={size}
      className={cn(className)}
    >
      <NavigationIcon />
      Cómo llegar
    </Button>
  );
}
