import { NextResponse } from "next/server";
import { connectWhatsApp } from "@/lib/whatsapp-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const snapshot = await connectWhatsApp();
  return NextResponse.json(snapshot);
}
