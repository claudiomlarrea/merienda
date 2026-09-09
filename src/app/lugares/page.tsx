import { Suspense } from "react";
import { PlacesBrowser } from "@/components/places-browser";

export const metadata = {
  title: "Lugares",
};

export default function LugaresPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      <h1 className="font-heading text-3xl sm:text-4xl">Lugares para merendar y comer</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Filtrá por merendar o comer, o escribí “cafecito”, “almuerzo”, “facturas”.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-muted-foreground">Cargando la guía…</p>}>
          <PlacesBrowser />
        </Suspense>
      </div>
    </div>
  );
}
