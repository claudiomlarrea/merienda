import { NextResponse } from "next/server";
import { stopSending } from "@/lib/whatsapp-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST() {
  return NextResponse.json(stopSending());
}
