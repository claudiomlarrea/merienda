import type { CocinaTag, DepartmentId, Moment, Place, PlaceKind, Source, Visibility } from "@/lib/types";
import { COCINA_TAGS } from "@/lib/types";

export const kindLabels: Record<PlaceKind, string> = {
  confiteria: "Confitería",
  cafe: "Café",
  "casa-de-te": "Casa de té",
  panaderia: "Panadería",
  pasteleria: "Pastelería",
  comedor: "Comedor",
  restaurante: "Restaurante",
  pizzeria: "Pizzería",
  empanadas: "Empanadas",
  vinoteca: "Vinoteca",
  bodega: "Bodega",
  heladeria: "Heladería",
  herboristeria: "Herboristería",
};

export const momentLabels: Record<Moment, string> = {
  merendar: "Merendar",
  comer: "Comer",
};

export const cocinaLabels: Record<CocinaTag, string> = {
  vegetariano: "Vegetariano",
  vegano: "Vegano",
  chino: "Comida china",
  sushi: "Sushi",
  parrilla: "Parrilla",
  "sin-tacc": "Sin TACC",
  pachata: "Pachatas",
};

export function placeCocinaTags(place: Place): CocinaTag[] {
  return place.tags.filter((tag): tag is CocinaTag =>
    (COCINA_TAGS as readonly string[]).includes(tag)
  );
}

const MERENDA_KINDS: PlaceKind[] = [
  "confiteria",
  "cafe",
  "casa-de-te",
  "panaderia",
  "pasteleria",
  "heladeria",
  "herboristeria",
];
const COMER_KINDS: PlaceKind[] = [
  "restaurante",
  "comedor",
  "pizzeria",
  "empanadas",
  "vinoteca",
  "bodega",
];

export function matchesMoment(place: Place, moment: string) {
  if (!moment) return true;
  if (moment === "merendar") {
    return (
      MERENDA_KINDS.includes(place.kind) ||
      place.tags.includes("merienda") ||
      place.tags.includes("desayuno")
    );
  }
  if (moment === "comer") {
    return (
      COMER_KINDS.includes(place.kind) ||
      place.tags.includes("almuerzo") ||
      place.tags.includes("cena")
    );
  }
  return true;
}

export const visibilityLabels: Record<Visibility, string> = {
  redes: "Casi solo en redes",
  "poco-conocido": "Poco conocido",
  conocido: "Más conocido",
};

export const sourceLabels: Record<Source, string> = {
  redes: "Redes",
  recorrido: "Recorrido",
  google: "Maps",
  "boca-en-boca": "Boca en boca",
};

export const departmentShort: Record<DepartmentId, string> = {
  capital: "Capital",
  rivadavia: "Rivadavia",
  "santa-lucia": "Santa Lucía",
  rawson: "Rawson",
  chimbas: "Chimbas",
  pocito: "Pocito",
  zonda: "Zonda",
  ullum: "Ullum",
  albardon: "Albardón",
  angaco: "Angaco",
  calingasta: "Calingasta",
  jachal: "Jáchal",
  iglesia: "Iglesia",
  caucete: "Caucete",
  "valle-fertil": "Valle Fértil",
  sarmiento: "Sarmiento",
  "san-martin": "San Martín",
  "9-de-julio": "9 de Julio",
  "25-de-mayo": "25 de Mayo",
};

export function profileUrl(handle: string) {
  return `https://www.instagram.com/${handle.replace(/^@/, "")}/`;
}

export function mapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function mapsDirectionsUrl(destination: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function whatsappUrl(phone: string, name: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Hola, vi ${name} en Merienda y quería confirmar horario.`)}`;
}

export function normalizeVisibilityFilter(value: string) {
  if (value === "instagram") return "redes";
  return value;
}
