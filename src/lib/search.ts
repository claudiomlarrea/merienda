import { departmentShort, kindLabels, sourceLabels } from "@/lib/labels";
import type { Place } from "@/lib/types";

export function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const SYNONYMS: Record<string, string[]> = {
  cafecito: ["cafe", "cafeteria", "confiteria"],
  cafecitos: ["cafe", "cafeteria", "confiteria"],
  cafeteria: ["cafe", "confiteria"],
  cafe: ["cafe", "cafeteria", "cafecito", "confiteria"],
  merienda: ["merienda", "te", "factura", "medialuna", "tostado"],
  facturas: ["factura", "medialuna", "confiteria"],
  factura: ["factura", "medialuna"],
  medialunas: ["medialuna", "factura"],
  medialuna: ["medialuna", "factura"],
  te: ["casa de te", "infusion", "merienda"],
  panaderia: ["panaderia", "confiteria", "factura"],
};

function expandToken(token: string) {
  return [token, ...(SYNONYMS[token] ?? [])];
}

export function placeHaystack(place: Place) {
  return fold(
    [
      place.name,
      place.locality,
      place.address,
      place.blurb,
      place.story,
      departmentShort[place.department],
      kindLabels[place.kind],
      ...place.sources.map((source) => sourceLabels[source]),
      ...place.tags,
      ...place.orderThis,
    ].join(" ")
  );
}

export function matchesPlaceQuery(place: Place, rawQuery: string) {
  const query = fold(rawQuery).trim();
  if (!query) return true;
  const haystack = placeHaystack(place);
  return query.split(/\s+/).every((token) => expandToken(token).some((item) => haystack.includes(item)));
}
