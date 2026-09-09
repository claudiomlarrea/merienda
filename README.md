# Merienda SJ

Guía sanjuanina de confiterías, cafés y casas de té en toda la provincia. Junta lo que aparece en Google con lo que circula por Instagram, Facebook o un recorrido por Zonda, Ullum, Calingasta, Jáchal, Iglesia y Caucete — y también los cafés de Capital.

Café Haití es el ejemplo del hueco: un local que la gente del departamento conoce y el resto de la provincia no, porque no está (bien) en los buscadores.

## Qué incluye esta versión

- Fichas reales de Capital, Rivadavia, Rawson, Zonda, Ullum, Calingasta, Jáchal, Iglesia y Caucete.
- Filtro **Casi solo en Instagram** y departamentos con pocas fichas a propósito.
- Rutas de merienda (Zonda–Ullum, Libertador, Barreal, Jáchal).
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

Las fichas combinan direcciones y horarios públicos (Google, sitios, notas locales) con locales vistos de recorrido o redes, a veces incompletos. Eso no es un error de carga: es el mapa real de merendar en San Juan. Si un dato está mal, corregilo desde **Sumar un local** o editando `src/lib/places.ts`.
