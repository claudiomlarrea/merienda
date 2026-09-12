import { NextResponse } from "next/server";
import { connectWhatsApp } from "@/lib/whatsapp-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let reset = false;
  try {
    const body = (await request.json()) as { reset?: boolean };
    reset = Boolean(body.reset);
  } catch {
    reset = false;
  }
  const snapshot = await connectWhatsApp({ reset });
  return NextResponse.json(snapshot);
}
