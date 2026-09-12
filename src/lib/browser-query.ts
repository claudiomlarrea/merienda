export type PlacesBrowserQuery = {
  q?: string;
  depto?: string;
  tipo?: string;
  momento?: string;
  visibilidad?: string;
  cocina?: string;
  guardados?: string;
};

function firstSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function placesBrowserQuery(
  searchParams: Record<string, string | string[] | undefined>
): PlacesBrowserQuery {
  return {
    q: firstSearchValue(searchParams.q),
    depto: firstSearchValue(searchParams.depto),
    tipo: firstSearchValue(searchParams.tipo),
    momento: firstSearchValue(searchParams.momento),
    visibilidad: firstSearchValue(searchParams.visibilidad),
    cocina: firstSearchValue(searchParams.cocina),
    guardados: firstSearchValue(searchParams.guardados),
  };
}
