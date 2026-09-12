import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { outreachLinkMessage, outreachMessage, venueSmsUrl } from "@/lib/outreach";
import { getPlace } from "@/lib/places";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  const place = getPlace(slug);
  if (!place?.phone) {
    return NextResponse.json({ error: "No hay teléfono." }, { status: 404 });
  }
  const text = outreachMessage(place);
  const smsUrl = venueSmsUrl(place.phone, outreachLinkMessage(place));
  if (!smsUrl) {
    return NextResponse.json({ error: "No se pudo armar el SMS." }, { status: 400 });
  }
  const [smsQrDataUrl, textQrDataUrl] = await Promise.all([
    QRCode.toDataURL(smsUrl, { margin: 1, width: 320, errorCorrectionLevel: "M" }),
    QRCode.toDataURL(text, { margin: 1, width: 320, errorCorrectionLevel: "M" }),
  ]);
  return NextResponse.json({
    smsQrDataUrl,
    textQrDataUrl,
    smsUrl,
    text,
    phone: place.phone,
    name: place.name,
  });
}
