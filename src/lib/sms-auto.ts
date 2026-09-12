import type { Place } from "@/lib/types";
import { needsSmsOutreach, outreachLinkMessage, venueSmsUrl } from "@/lib/outreach";

export type SmsTarget = {
  slug: string;
  name: string;
  phone: string;
  sms: string;
};

export function smsTargetsFor(places: Place[]): SmsTarget[] {
  return places.flatMap((place) => {
    if (!needsSmsOutreach(place) || !place.phone) return [];
    const sms = venueSmsUrl(place.phone, outreachLinkMessage(place));
    if (!sms) return [];
    return [{ slug: place.slug, name: place.name, phone: place.phone, sms }];
  });
}

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Página para el celular: abre Mensajes y sigue sola al volver de cada envío. */
export function smsAutoHtml(targets: SmsTarget[]) {
  const payload = JSON.stringify(targets);
  const names = targets.map((item) => `<li>${esc(item.name)}</li>`).join("");
  return `<!DOCTYPE html>
<html lang="es-AR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="robots" content="noindex" />
  <title>Merienda · Enviar SMS</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, sans-serif;
      background: #f4efe6;
      color: #1f1b16;
      padding: 20px 16px 40px;
    }
    h1 { font-size: 1.7rem; line-height: 1.2; margin: 0 0 8px; }
    p, li { line-height: 1.5; }
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 0 0 1px rgba(31, 27, 22, 0.08);
      margin: 16px 0;
    }
    button {
      width: 100%;
      min-height: 52px;
      margin: 8px 0 0;
      font-size: 1.05rem;
      border: 0;
      border-radius: 12px;
      background: #6b3f2a;
      color: #fff;
    }
    button.secondary { background: #fff; color: #1f1b16; border: 1px solid #d7cfc4; }
    button:disabled { opacity: 0.5; }
    #status { font-weight: 600; }
    ul { padding-left: 1.2rem; margin: 8px 0 0; }
    .muted { color: #6b645c; font-size: 0.95rem; }
  </style>
</head>
<body>
  <h1>Enviar todos por SMS</h1>
  <p class="muted">Son ${targets.length} locales con teléfono que no recibieron el WhatsApp. WhatsApp ya se mandó a los demás: acá no se repiten.</p>
  <div class="card">
    <p id="status">Listos: ${targets.length}</p>
    <p id="now" class="muted"></p>
    <button id="start" type="button">Enviar todos</button>
    <button id="pause" class="secondary" type="button">Pausar</button>
    <button id="one" class="secondary" type="button">Solo el siguiente</button>
  </div>
  <p class="muted">Tocá Enviar todos. Se abre Mensajes con el texto de Claudio Larrea. Mandalo y volvé a esta pantalla: sigue sola. No uses WhatsApp.</p>
  <div class="card">
    <p><strong>Pendientes</strong></p>
    <ul id="list">${names}</ul>
  </div>
  <script>
    const TARGETS = ${payload};
    const DONE_KEY = "merienda-sms-auto-done";
    const GAP_MS = 1400;
    const FALLBACK_MS = 9000;
    const done = new Set(JSON.parse(localStorage.getItem(DONE_KEY) || "[]"));
    let running = false;
    let currentSlug = null;
    let fallbackTimer = 0;
    let handling = false;

    function pending() {
      return TARGETS.filter((item) => !done.has(item.slug));
    }
    function save() {
      localStorage.setItem(DONE_KEY, JSON.stringify([...done]));
    }
    function render() {
      const left = pending();
      const status = document.getElementById("status");
      const now = document.getElementById("now");
      status.textContent = done.size + " de " + TARGETS.length + " ya se abrieron.";
      now.textContent = left[0]
        ? (running ? "Mandando: " : "Siguiente: ") + left[0].name + " · " + left.length + " quedan."
        : "Listo. No quedan SMS de esta lista.";
      const busy = running || Boolean(currentSlug);
      document.getElementById("start").disabled = !left[0] || busy;
      document.getElementById("one").disabled = !left[0] || busy;
      document.getElementById("list").innerHTML = left.map((item) => "<li>" + item.name + "</li>").join("") || "<li>Nada pendiente.</li>";
    }
    function openSms(item) {
      const link = document.createElement("a");
      link.href = item.sms;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    function clearFallback() {
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      fallbackTimer = 0;
    }
    function markCurrent() {
      if (!currentSlug) return;
      done.add(currentSlug);
      currentSlug = null;
      save();
      render();
    }
    function openNext() {
      clearFallback();
      const left = pending();
      if (!left[0]) {
        running = false;
        render();
        return;
      }
      currentSlug = left[0].slug;
      render();
      openSms(left[0]);
      fallbackTimer = window.setTimeout(function () {
        if (document.visibilityState === "visible") afterReturn();
      }, FALLBACK_MS);
    }
    function afterReturn() {
      if (handling) return;
      handling = true;
      clearFallback();
      markCurrent();
      if (!running) {
        handling = false;
        return;
      }
      window.setTimeout(function () {
        handling = false;
        openNext();
      }, GAP_MS);
    }
    document.getElementById("start").onclick = function () {
      running = true;
      render();
      openNext();
    };
    document.getElementById("pause").onclick = function () {
      running = false;
      clearFallback();
      render();
    };
    document.getElementById("one").onclick = function () {
      running = false;
      openNext();
    };
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && currentSlug) {
        window.setTimeout(afterReturn, GAP_MS);
      }
    });
    render();
  </script>
</body>
</html>`;
}
