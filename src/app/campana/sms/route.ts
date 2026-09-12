import { NextResponse } from "next/server";
import { places } from "@/lib/places";
import { smsAutoHtml, smsTargetsFor } from "@/lib/sms-auto";

export const dynamic = "force-dynamic";

/** Paquete HTML para el celular: abre Mensajes y recorre el lote. */
export async function GET() {
  const html = smsAutoHtml(smsTargetsFor(places));
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
