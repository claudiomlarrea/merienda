import type { Place } from "@/lib/types";

/** URL pública que ya comparte la gente; la preview de WhatsApp se ve bien. */
export const SHARE_ORIGIN = "https://merienda-gamma.vercel.app";

export const MY_WHATSAPP_KEY = "merienda-sj-my-whatsapp";
export const SMS_SENT_KEY = "merienda-sj-sms-sent";
export const SMS_CRED_KEY = "merienda-sj-sms-cred";

/** Lo que el panel viejo mezclaba con WhatsApp y con locales sin teléfono. No usarlo para el lote de SMS. */
export const OUTREACH_SENT_KEY = "merienda-sj-outreach-sent";

/** Ya recibieron el WhatsApp de Claudio. No repetir por SMS. */
export const WHATSAPP_ALREADY_SENT = new Set([
  "la-coqueta",
  "gardel-confiteria",
  "el-ensueno-ullum",
  "cinco-uno",
  "entre-montanas",
  "casa-lena",
  "bonito-cafe",
  "clapton",
  "las-delicias",
  "victoria-igualada",
  "edesia-jachal",
  "don-lisandro",
  "yo-tengo-fe",
  "inna-cafe",
  "panaderia-san-martin",
  "dulce-alma",
  "isalu-pasteleria",
  "bendito-cafe",
  "panaderia-cuyo",
  "confiteria-paris",
  "thonet-cafe",
  "tres-cumbres",
  "pasteleria-la-nueva",
  "helados-del-parque-caucete",
  "cefferino",
  "vono-cafe",
  "del-parque-desamparados",
  "hostal-de-palito",
  "la-tapera",
  "rocknrolla",
  "las-invernadas",
  "de-mono-rojo",
  "resto-1592",
  "tazio",
  "roggers",
  "la-paisanita",
  "hells-pizza",
  "almacen-de-pizzas",
  "estacion-de-vinos",
  "cava-de-autor",
  "nono-chicho",
  "abuelo-yuyi",
  "soychu",
  "redondita",
  "chia-fast-good",
  "sushiclub",
  "sushi-2x1",
  "parrilla-los-nogales",
  "rocco",
  "alma-delicias-sin-tacc",
  "di-roma-rivadavia",
]);

export function placeShareUrl(slug: string) {
  return `${SHARE_ORIGIN}/lugares/${slug}`;
}

/** Quedan para SMS: tienen teléfono y no recibieron el WhatsApp de Claudio. */
export function needsSmsOutreach(place: Place) {
  return Boolean(place.phone) && !WHATSAPP_ALREADY_SENT.has(place.slug);
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

/** Mensaje para el enlace de WhatsApp: más corto para que no se corte. */
export function outreachLinkMessage(place: Place) {
  return [
    "Hola, soy Claudio Larrea. Armamos Merienda: https://merienda-gamma.vercel.app",
    `Los incluimos acá: ${placeShareUrl(place.slug)}`,
    "Si están conformes, ¿pueden pasarla por redes o por el estado? No hay costo.",
  ].join("\n");
}

export function venueChatUrl(phone: string, text: string) {
  const digits = toWhatsAppDigits(phone) ?? venueWhatsAppCandidates(phone)[0];
  if (!digits) return null;
  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(text)}`;
}

export function venueSmsUrl(phone: string, text: string) {
  const digits = toWhatsAppDigits(phone) ?? venueWhatsAppCandidates(phone)[0];
  if (!digits) return null;
  return `sms:+${digits}?body=${encodeURIComponent(text)}`;
}

export function venueCallUrl(phone: string) {
  const digits = toWhatsAppDigits(phone) ?? venueWhatsAppCandidates(phone)[0];
  if (!digits) return null;
  return `tel:+${digits}`;
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
