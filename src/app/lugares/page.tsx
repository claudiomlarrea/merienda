import { Suspense } from "react";
import { PlacesBrowser } from "@/components/places-browser";

export const metadata = {
  title: "Lugares",
};

export default function LugaresPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="font-heading text-4xl">Lugares para merendar</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Filtrá por departamento, por tipo o por qué tan escondido está. Las fichas incompletas
        no se esconden: son el punto.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-muted-foreground">Cargando la guía…</p>}>
          <PlacesBrowser />
        </Suspense>
      </div>
    </div>
  );
}
