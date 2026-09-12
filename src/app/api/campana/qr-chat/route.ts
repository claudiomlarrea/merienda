import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { outreachMessage, venueChatUrl } from "@/lib/outreach";
import { getPlace } from "@/lib/places";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  const place = getPlace(slug);
  if (!place?.phone) {
    return NextResponse.json({ error: "No hay teléfono." }, { status: 404 });
  }
  const url = venueChatUrl(place.phone, outreachMessage(place));
  if (!url) {
    return NextResponse.json({ error: "No se pudo armar el chat." }, { status: 400 });
  }
  const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 320 });
  return NextResponse.json({ qrDataUrl, url, name: place.name });
}
