export const CONTACT_EMAIL = "claudio17larrea@gmail.com";
export const CONTACT_NAME = "Claudio Larrea";

export function contactoMailto(input: {
  nombre: string;
  respuesta: string;
  mensaje: string;
}) {
  const lines = [
    input.mensaje,
    "",
    input.nombre ? `Nombre: ${input.nombre}` : "",
    input.respuesta ? `Para responder: ${input.respuesta}` : "",
  ].filter(Boolean);
  const subject = input.nombre
    ? `Merienda · comentario de ${input.nombre}`
    : "Merienda · comentario";
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}
