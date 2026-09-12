import type { Place } from "@/lib/types";

/** URL pública que ya comparte la gente; la preview de WhatsApp se ve bien. */
export const SHARE_ORIGIN = "https://merienda-gamma.vercel.app";

export const MY_WHATSAPP_KEY = "merienda-sj-my-whatsapp";
export const OUTREACH_SENT_KEY = "merienda-sj-outreach-sent";

export function placeShareUrl(slug: string) {
  return `${SHARE_ORIGIN}/lugares/${slug}`;
}

/** Mensaje exacto que sale de tu WhatsApp hacia cada local. */
export function outreachMessage(place: Place) {
  return [
    "Hola, soy Claudio Larrea. Armamos Merienda, una guía para el celular de dónde merendar y comer en los 19 departamentos de San Juan: https://merienda-gamma.vercel.app",
    "",
    `Los incluimos acá: ${placeShareUrl(place.slug)}`,
    "",
    "Si están conformes, ¿pueden pasarla por redes o por el estado? No hay costo. Si algún dato está mal, me avisan y lo corrijo.",
  ].join("\n");
}

/** Copia en tu chat, idéntica a la que recibe el local. */
export function selfOutreachMessage(place: Place) {
  return outreachMessage(place);
}

export function campaignStartNote(count: number) {
  return `Claudio Larrea — Merienda. Empiezo a enviar ${count} mensajes desde mi WhatsApp, cada uno con la ficha de ese local.`;
}

/**
 * Normaliza un celular argentino para WhatsApp.
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

/** Prueba con 9 y sin 9: muchos fijos de San Juan están cargados sin celular. */
export function venueWhatsAppCandidates(phone: string): string[] {
  const seen = new Set<string>();
  const add = (value: string | null) => {
    if (value && value.length >= 11) seen.add(value);
  };
  add(toWhatsAppDigits(phone));
  let raw = phone.replace(/\D/g, "");
  if (raw.startsWith("00")) raw = raw.slice(2);
  if (raw.startsWith("0")) raw = raw.slice(1);
  if (!raw.startsWith("54")) raw = `54${raw}`;
  add(raw);
  if (raw.startsWith("549")) add(`54${raw.slice(3)}`);
  if (raw.startsWith("54") && !raw.startsWith("549")) add(`549${raw.slice(2)}`);
  return [...seen];
}

export function whatsappJid(digits: string) {
  return `${digits}@s.whatsapp.net`;
}

export function venueChatUrl(phone: string, text: string) {
  const digits = toWhatsAppDigits(phone) ?? venueWhatsAppCandidates(phone)[0];
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function venueWhatsAppAppUrl(phone: string, text: string) {
  const digits = toWhatsAppDigits(phone) ?? venueWhatsAppCandidates(phone)[0];
  if (!digits) return null;
  return `whatsapp://send?phone=${digits}&text=${encodeURIComponent(text)}`;
}

/** Abre un chat con TU WhatsApp. */
export function myWhatsAppUrl(myPhone: string, text: string) {
  const digits = toWhatsAppDigits(myPhone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function myWhatsAppAppUrl(myPhone: string, text: string) {
  const digits = toWhatsAppDigits(myPhone);
  if (!digits) return null;
  return `whatsapp://send?phone=${digits}&text=${encodeURIComponent(text)}`;
}
