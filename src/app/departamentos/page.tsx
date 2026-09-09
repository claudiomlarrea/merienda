import Link from "next/link";
import { placesByDepartment } from "@/lib/places";
import { departments } from "@/lib/departments";

export const metadata = {
  title: "Departamentos",
};

export default function DepartamentosPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      <h1 className="font-heading text-3xl sm:text-4xl">San Juan por departamento</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Cada departamento merienda a su manera: los 19, no solo el Gran San Juan. Cafés de
        Capital, parrillas de Jáchal, helado de Valle Fértil y mostradores que se conocen por un
        cartel.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((department) => {
          const count = placesByDepartment(department.id).length;
          return (
            <li key={department.id}>
              <Link
                href={`/departamentos/${department.id}`}
                className="block h-full rounded-3xl bg-card p-5 ring-1 ring-foreground/8 transition-shadow hover:ring-foreground/20"
              >
                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                  {department.region}
                </p>
                <h2 className="font-heading mt-1 text-2xl">{department.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{department.pitch}</p>
                <p className="mt-4 text-sm">
                  {count === 0 ? "Todavía sin fichas — sumá una" : `${count} ${count === 1 ? "lugar" : "lugares"}`}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
