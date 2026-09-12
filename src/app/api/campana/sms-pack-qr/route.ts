import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { places } from "@/lib/places";
import { smsTargetsFor } from "@/lib/sms-auto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const url = `${origin}/campana/sms`;
  const remaining = smsTargetsFor(places).length;
  const qrDataUrl = await QRCode.toDataURL(url, {
    margin: 1,
    width: 360,
    errorCorrectionLevel: "M",
  });
  return NextResponse.json({ url, qrDataUrl, remaining });
}
