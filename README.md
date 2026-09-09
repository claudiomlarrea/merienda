# Merienda

Guía sanjuanina de confiterías, cafés y lugares para comer en toda la provincia. Junta lo que aparece en el mapa con lo que circula por redes o un recorrido por Zonda, Ullum, Calingasta, Jáchal, Iglesia y Caucete — y también los cafés, restos, pizzerías, heladerías, sushi y parrillas de Capital.

Hay locales que la gente del departamento conoce y casi no aparecen en los buscadores. Esta guía los pone junto a los que ya tienen ficha, sin destacar a uno solo.

## Qué incluye esta versión

- Fichas de Capital, Rivadavia, Rawson, Zonda, Ullum, Calingasta, Jáchal, Iglesia, Caucete, Chimbas, Albardón, Pocito, Santa Lucía, Valle Fértil y Sarmiento.
- Filtro **Merendar / Comer**, tipos (incluye heladería) y **Cocina**: vegetariano, vegano, sushi, parrilla, sin TACC, comida china.
- En cada ficha, **Cómo llegar** abre Google Maps con destino al local (usa tu ubicación actual si el teléfono la permite).
- Página **Huecos**: cómo seguir buscando (recorrido, redes por ubicación, grupos del pueblo) y departamentos con pocas fichas.
- El buscador ignora tildes y entiende “helado”, “sushi”, “parrilla”, “vegano”, “sin tacc”.
- Rutas (Zonda–Ullum, Libertador, Desamparados, Barreal, Jáchal).
- Formulario para **sumar un local** aunque falte la calle. En este prototipo se guarda en el navegador.

Los horarios de pueblo cambian. La guía lo dice en cada ficha: confirmá por redes antes de cruzar el dique.

## Cómo correrla

```bash
npm install
npm run dev -- --port 4567 --hostname 127.0.0.1
```

Abrí [http://127.0.0.1:4567](http://127.0.0.1:4567).

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui.

## Nota sobre los datos

Las fichas combinan direcciones y horarios públicos (Maps, sitios, notas locales) con locales vistos de recorrido o redes, a veces incompletos. Eso no es un error de carga: es el mapa real de merendar y comer en San Juan. Si un dato está mal, corregilo desde **Sumar un local** o editando `src/lib/places.ts`.
