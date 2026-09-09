import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-start gap-4 px-4 py-20">
      <h1 className="font-heading text-3xl">Esa página no está en el mapa</h1>
      <p className="text-muted-foreground">
        Puede ser un departamento sin ficha o un local que todavía no cargamos. El hueco se tapa sumándolo.
      </p>
      <div className="flex gap-2">
        <Button render={<Link href="/lugares" />}>Ver lugares</Button>
        <Button render={<Link href="/sumar" />} variant="outline">
          Sumar un local
        </Button>
      </div>
    </div>
  );
}
