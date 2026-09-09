export const DEPARTMENTS = [
  "capital",
  "rivadavia",
  "santa-lucia",
  "rawson",
  "chimbas",
  "pocito",
  "zonda",
  "ullum",
  "albardon",
  "calingasta",
  "jachal",
  "iglesia",
  "caucete",
  "valle-fertil",
  "sarmiento",
] as const;

export type DepartmentId = (typeof DEPARTMENTS)[number];

export const PLACE_KINDS = [
  "confiteria",
  "cafe",
  "casa-de-te",
  "panaderia",
  "pasteleria",
  "comedor",
  "restaurante",
  "pizzeria",
  "empanadas",
  "vinoteca",
] as const;

export const MOMENTS = ["merendar", "comer"] as const;
export type Moment = (typeof MOMENTS)[number];

export type PlaceKind = (typeof PLACE_KINDS)[number];

export const VISIBILITY = ["redes", "poco-conocido", "conocido"] as const;
export type Visibility = (typeof VISIBILITY)[number];

export const SOURCES = ["redes", "recorrido", "google", "boca-en-boca"] as const;
export type Source = (typeof SOURCES)[number];

export type Place = {
  slug: string;
  name: string;
  kind: PlaceKind;
  department: DepartmentId;
  locality: string;
  address: string;
  addressConfirmed: boolean;
  hours: string;
  phone?: string;
  handle?: string;
  visibility: Visibility;
  sources: Source[];
  blurb: string;
  story: string;
  orderThis: string[];
  tags: string[];
  image: string;
  imageAlt: string;
  mapsQuery: string;
  community?: boolean;
};

export type Department = {
  id: DepartmentId;
  name: string;
  region: string;
  pitch: string;
};

export type MeriendaRoute = {
  slug: string;
  title: string;
  subtitle: string;
  duration: string;
  km: string;
  placeSlugs: string[];
  why: string;
};
