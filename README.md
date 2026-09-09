# Merienda

Guía sanjuanina de confiterías, cafés y lugares para comer en los 19 departamentos. Junta lo que el mapa de Capital no encuentra — restoranes, pizzerías, pachatas, heladerías, vinotecas y herboristerías de Albardón, Calingasta, Jáchal, Iglesia, Valle Fértil, 25 de Mayo y el resto — con lo que circula por redes o un recorrido.

Hay locales que la gente del departamento conoce y casi no aparecen en los buscadores. Esta guía los pone junto a los que ya tienen ficha, sin destacar a uno solo.

La app está pensada para **abrirse en el celular**: botones grandes, barra de abajo, y se puede agregar a la pantalla de inicio.

## Dónde hostearla

Esta guía es una app Next.js. No usa base de datos: las fichas van en el código y lo que alguien suma se guarda en ese celular.

- **Vercel** (a veces lo escriben Vergel): el lugar natural. Next.js sale de la misma empresa; HTTPS, dominio y preview en cada push. Es lo que conviene para que la gente la abra desde el teléfono.
- **Firebase App Hosting**: sirve si ya estás metido en Google/Firebase. El Hosting clásico de Firebase es para sitios estáticos; esta app no es un HTML suelto.
- **Neon**: no es hosting de la app. Es Postgres. Acá no hace falta una base.

Recomendación: subila a **Vercel**. Conectá el repo, `npm run build` corre solo, y el celular entra por HTTPS.

## Qué incluye esta versión

- Los **19 departamentos**, incluidos Angaco, 9 de Julio, San Martín y 25 de Mayo.
- Filtro **Merendar / Comer**, tipos (heladería, herboristería, pizzería, vinoteca) y **Cocina** (pachatas, parrilla, vegano, sin TACC).
- Atajos de búsqueda: pachatas, cafés, vinoteca, helado.
- En cada ficha, **Cómo llegar** abre Google Maps con destino al local.
- Página **Huecos**: Angaco y 9 de Julio siguen cortos; se recorren, no se googlean desde Libertador.
- El buscador ignora tildes y entiende “pachatas”, “cafés”, “helado”, “parrilla”, “herboristería”, “sin tacc”.
- Rutas (Zonda–Ullum, Libertador, Desamparados, Barreal, Jáchal, Valle Fértil).
- Formulario para **sumar un local** aunque falte la calle. En este prototipo se guarda en el navegador.

Los horarios de pueblo cambian. La guía lo dice en cada ficha: confirmá por redes antes de cruzar el dique.

## Cómo correrla

```bash
npm install
npm run dev
```

Abrí [http://127.0.0.1:4567](http://127.0.0.1:4567) desde el celular (misma red) o con el modo responsive del navegador.

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui.

## Nota sobre los datos

Las fichas combinan direcciones y horarios públicos (Maps, sitios, notas locales) con locales vistos de recorrido o redes, a veces incompletos. Eso no es un error de carga: es el mapa real de merendar y comer en San Juan. Si un dato está mal, corregilo desde **Sumar un local** o editando `src/lib/places.ts`.
