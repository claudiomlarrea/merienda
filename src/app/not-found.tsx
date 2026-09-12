import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-start gap-4 px-4 py-20">
        <h1 className="font-heading text-3xl">No encontramos esa página</h1>
        <p className="text-muted-foreground">
          Volvé al inicio o buscá un lugar.
        </p>
      <div className="flex gap-2">
        <Button render={<Link href="/#explorar" />}>Ver lugares</Button>
        <Button render={<Link href="/contacto" />} variant="outline">
          Contacto
        </Button>
      </div>
    </div>
  );
}
