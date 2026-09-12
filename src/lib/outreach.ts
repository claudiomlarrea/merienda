import type { Place } from "@/lib/types";

/** URL pública que ya comparte la gente; la preview de WhatsApp se ve bien. */
export const SHARE_ORIGIN = "https://merienda-gamma.vercel.app";

export const MY_WHATSAPP_KEY = "merienda-sj-my-whatsapp";
export const OUTREACH_SENT_KEY = "merienda-sj-outreach-sent";

export function placeShareUrl(slug: string) {
  return `${SHARE_ORIGIN}/lugares/${slug}`;
}

export function outreachMessage(place: Place) {
  return [
    "Hola, soy Claudio. Armamos Merienda, una guía para el celular de dónde merendar y comer en los 19 departamentos de San Juan: https://merienda-gamma.vercel.app",
    "",
    `Los incluimos acá: ${placeShareUrl(place.slug)}`,
    "",
    "Si están conformes, ¿pueden pasarla por redes o por el estado? No hay costo. Si algún dato está mal, me avisan y lo corrijo.",
  ].join("\n");
}

/** Texto que te llega a vos, con a quién reenviar. */
export function selfOutreachMessage(place: Place) {
  const destino = place.phone
    ? `Reenviar a: ${place.name}\nTel del local: ${place.phone}`
    : `Reenviar a: ${place.name}\nSin teléfono en la ficha — buscalo por el nombre.`;
  return `${destino}\n\n${outreachMessage(place)}`;
}

/**
 * Normaliza un celular argentino para wa.me.
 * Solo se usa con TU número. Nunca con el del local.
 */
export function toWhatsAppDigits(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.startsWith("549") && digits.length >= 12) return digits;
  if (digits.startsWith("54") && digits.length >= 11) {
    return digits.startsWith("549") ? digits : `549${digits.slice(2)}`;
  }
  if (digits.startsWith("9") && digits.length >= 10) return `54${digits}`;
  if (digits.length >= 8) return `549${digits}`;
  return null;
}

/** Abre un chat con TU WhatsApp, nunca con el del restorán. */
export function myWhatsAppUrl(myPhone: string, text: string) {
  const digits = toWhatsAppDigits(myPhone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
