import { NextResponse } from "next/server";
import { sendCampaign } from "@/lib/whatsapp-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      myPhone?: string;
      slugs?: string[];
      force?: boolean;
      alreadySent?: string[];
    };
    const myPhone = body.myPhone?.trim() ?? "";
    const slugs = Array.isArray(body.slugs) ? body.slugs.filter((item) => typeof item === "string") : [];
    const alreadySent = Array.isArray(body.alreadySent)
      ? body.alreadySent.filter((item) => typeof item === "string")
      : [];
    const snapshot = await sendCampaign(myPhone, slugs, { force: Boolean(body.force), alreadySent });
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo enviar." },
      { status: 400 }
    );
  }
}
