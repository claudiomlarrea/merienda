export type UsoEvento = {
  t: string;
  tipo: "visita" | "descarga";
  path: string;
};

export type UsoState = {
  visitas: number;
  visitantes: number;
  descargas: number;
  paginas: Record<string, number>;
  eventos: UsoEvento[];
  actualizado: string | null;
};

export const emptyUso = (): UsoState => ({
  visitas: 0,
  visitantes: 0,
  descargas: 0,
  paginas: {},
  eventos: [],
  actualizado: null,
});

const SKIP_PREFIXES = ["/uso", "/campana", "/api"];

export function shouldCountPath(path: string) {
  const clean = normalizeUsoPath(path);
  return !SKIP_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`));
}

export function normalizeUsoPath(path: string) {
  const raw = path.split("?")[0]?.split("#")[0] || "/";
  if (raw.length > 1 && raw.endsWith("/")) return raw.slice(0, -1);
  return raw || "/";
}

export function isBot(userAgent: string) {
  return /bot|crawl|spider|slurp|facebookexternalhit|preview|whatsapp/i.test(userAgent);
}
