import { NextResponse } from "next/server";
import { disconnectWhatsApp } from "@/lib/whatsapp-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const snapshot = await disconnectWhatsApp();
  return NextResponse.json(snapshot);
}
