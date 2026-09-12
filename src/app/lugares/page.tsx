import { PlacesBrowser } from "@/components/places-browser";
import { placesBrowserQuery } from "@/lib/browser-query";

export const metadata = {
  title: "Lugares",
};

export default async function LugaresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = placesBrowserQuery(await searchParams);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      <h1 className="font-heading text-3xl sm:text-4xl">Lugares para merendar y comer</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Filtrá por merendar o comer, o escribí “cafecito”, “almuerzo”, “facturas”.
      </p>
      <div className="mt-8">
        <PlacesBrowser key={JSON.stringify(query)} initialQuery={query} />
      </div>
    </div>
  );
}
