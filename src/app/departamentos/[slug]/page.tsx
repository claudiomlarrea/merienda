import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlacesBrowser } from "@/components/places-browser";
import { departments, getDepartment } from "@/lib/departments";

export function generateStaticParams() {
  return departments.map((department) => ({ slug: department.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const department = getDepartment(slug);
  return { title: department?.name ?? "Departamento" };
}

export default async function DepartmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const department = getDepartment(slug);
  if (!department) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{department.region}</p>
      <h1 className="font-heading mt-2 text-4xl">{department.name}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-muted-foreground">{department.pitch}</p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-muted-foreground">Cargando lugares…</p>}>
          <PlacesBrowser initialDepartment={department.id} />
        </Suspense>
      </div>
    </div>
  );
}
