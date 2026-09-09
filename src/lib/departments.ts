import type { Department } from "@/lib/types";

export const departments: Department[] = [
  {
    id: "capital",
    name: "Capital",
    region: "Gran San Juan",
    pitch:
      "Peatonal, pasillos, especialidad y confiterías clásicas. El corazón de la merienda sanjuanina, con locales a la calle y otros más escondidos.",
  },
  {
    id: "rivadavia",
    name: "Rivadavia",
    region: "Gran San Juan",
    pitch:
      "Libertador es una ruta de meriendas: casas de té, pastelerías y brunchs a lo largo de Rivadavia.",
  },
  {
    id: "santa-lucia",
    name: "Santa Lucía",
    region: "Gran San Juan",
    pitch: "Barrios pegados a Capital, con pastelería y cafés de barrio que no salen en las guías turísticas.",
  },
  {
    id: "rawson",
    name: "Rawson",
    region: "Gran San Juan",
    pitch:
      "Villa Krause tiene cafeterías que se mueven por redes tanto como por la vereda.",
  },
  {
    id: "chimbas",
    name: "Chimbas",
    region: "Gran San Juan",
    pitch: "Departamento denso, con pocos cafés indexados. Ideal para sumar fichas de recorrido.",
  },
  {
    id: "pocito",
    name: "Pocito",
    region: "Valle de Tulum",
    pitch: "Villa Aberastain y alrededores: más resto que confitería, pero hay meriendas si sabés dónde parar.",
  },
  {
    id: "zonda",
    name: "Zonda",
    region: "Valle y quebrada",
    pitch:
      "A 15 minutos de la ciudad y parece otro planeta: casas de té, merienda con cerro y locales que solo circulan por redes.",
  },
  {
    id: "ullum",
    name: "Ullum",
    region: "Dique y valle",
    pitch:
      "Comedores, maxikioscos que sirven café y paradas de dique. Casi nada aparece si buscás “confitería Ullum”.",
  },
  {
    id: "albardon",
    name: "Albardón",
    region: "Norte del Tulum",
    pitch: "Poco mapeado para meriendas. Si encontraste un local, esta guía lo necesita.",
  },
  {
    id: "calingasta",
    name: "Calingasta",
    region: "Alta montaña",
    pitch: "Barreal y el valle: casas de té familiares, heladería artesanal y desayunos regionales con cordillera.",
  },
  {
    id: "jachal",
    name: "Jáchal",
    region: "Norte",
    pitch: "San José de Jáchal tiene café de especialidad y bares de pueblo. Vale el viaje solo por merendar.",
  },
  {
    id: "iglesia",
    name: "Iglesia",
    region: "Norte andino",
    pitch: "Rodeo y Las Flores: paradores de montaña. La oferta es chica y se entera por redes del pueblo.",
  },
  {
    id: "caucete",
    name: "Caucete",
    region: "Este",
    pitch: "Vallecito y el paraje de Difunta Correa: confiterías de ruta que el turista cruza sin saber el nombre.",
  },
  {
    id: "valle-fertil",
    name: "Valle Fértil",
    region: "Este",
    pitch: "Comedores de pueblo camino a Ischigualasto. No son “cafés de especialidad”: son merienda de verdad.",
  },
  {
    id: "sarmiento",
    name: "Sarmiento",
    region: "Sur · Ruta 40",
    pitch:
      "Media Agua y la Ruta 40: cafés de pueblo, pastelerías y paradas de merienda que no entran en las listas de Capital.",
  },
];

export function getDepartment(id: string) {
  return departments.find((item) => item.id === id);
}
