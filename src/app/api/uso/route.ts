import { NextResponse } from "next/server";
import { isBot, normalizeUsoPath, shouldCountPath } from "@/lib/uso";
import { getUso, recordUso } from "@/lib/uso-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "merienda-vid";

type Body = {
  tipo?: "visita" | "descarga";
  path?: string;
};

export async function GET() {
  return NextResponse.json(await getUso());
}

export async function POST(request: Request) {
  const agent = request.headers.get("user-agent") ?? "";
  if (isBot(agent)) {
    return NextResponse.json(await getUso());
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const tipo = body.tipo === "descarga" ? "descarga" : "visita";
  const page = normalizeUsoPath(typeof body.path === "string" ? body.path : "/");
  if (tipo === "visita" && !shouldCountPath(page)) {
    return NextResponse.json(await getUso());
  }

  const cookies = request.headers.get("cookie") ?? "";
  const hasVisitor = cookies.split(";").some((part) => part.trim().startsWith(`${VISITOR_COOKIE}=`));
  const nuevoVisitante = !hasVisitor;
  const visitorId = hasVisitor
    ? ""
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

  const state = await recordUso({
    tipo,
    path: page,
    nuevoVisitante: tipo === "visita" && nuevoVisitante,
  });

  const response = NextResponse.json(state);
  if (nuevoVisitante) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: true,
    });
  }
  return response;
}
