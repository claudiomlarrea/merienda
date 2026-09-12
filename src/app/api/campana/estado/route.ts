import { NextResponse } from "next/server";
import { getSnapshot } from "@/lib/whatsapp-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getSnapshot());
}
