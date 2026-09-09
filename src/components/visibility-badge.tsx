import { Badge } from "@/components/ui/badge";
import { visibilityLabels } from "@/lib/labels";
import type { Visibility } from "@/lib/types";

export function VisibilityBadge({ value }: { value: Visibility }) {
  if (value === "instagram") {
    return (
      <Badge className="bg-primary text-primary-foreground">{visibilityLabels[value]}</Badge>
    );
  }
  if (value === "poco-conocido") {
    return <Badge variant="secondary">{visibilityLabels[value]}</Badge>;
  }
  return <Badge variant="outline">{visibilityLabels[value]}</Badge>;
}
