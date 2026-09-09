import type { DepartmentId, PlaceKind, Source, Visibility } from "@/lib/types";

export const kindLabels: Record<PlaceKind, string> = {
  confiteria: "Confitería",
  cafe: "Café",
  "casa-de-te": "Casa de té",
  panaderia: "Panadería",
  pasteleria: "Pastelería",
  comedor: "Comedor",
};

export const visibilityLabels: Record<Visibility, string> = {
  instagram: "Casi solo en Instagram",
  "poco-conocido": "Poco conocido",
  conocido: "Ya circula en el centro",
};

export const sourceLabels: Record<Source, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  recorrido: "Recorrido",
  google: "Google",
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
  calingasta: "Calingasta",
  jachal: "Jáchal",
  iglesia: "Iglesia",
  caucete: "Caucete",
  "valle-fertil": "Valle Fértil",
};

export function instagramUrl(handle: string) {
  return `https://www.instagram.com/${handle.replace(/^@/, "")}/`;
}

export function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function whatsappUrl(phone: string, name: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Hola, vi ${name} en Merienda SJ y quería confirmar horario.`)}`;
}
