import { NextResponse } from "next/server";
import {
  needsSmsOutreach,
  outreachLinkMessage,
  toWhatsAppDigits,
  venueWhatsAppCandidates,
  WHATSAPP_ALREADY_SENT,
} from "@/lib/outreach";
import { getPlace, places } from "@/lib/places";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  slugs?: string[];
  fromPhone?: string;
  httpSmsKey?: string;
  twilioSid?: string;
  twilioToken?: string;
  twilioFrom?: string;
};

function toNumber(phone: string) {
  const digits = toWhatsAppDigits(phone) ?? venueWhatsAppCandidates(phone)[0];
  return digits ? `+${digits}` : null;
}

async function sendHttpSms(key: string, from: string, to: string, content: string) {
  const response = await fetch("https://api.httpsms.com/v1/messages/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
    },
    body: JSON.stringify({ from, to, content }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text.slice(0, 180) || `HttpSMS ${response.status}`);
  }
}

async function sendTwilio(sid: string, token: string, from: string, to: string, body: string) {
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: to, Body: body }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text.slice(0, 180) || `Twilio ${response.status}`);
  }
}

export async function GET() {
  const remaining = places.filter(needsSmsOutreach).map((place) => ({
    slug: place.slug,
    name: place.name,
    phone: place.phone,
  }));
  return NextResponse.json({
    remaining: remaining.length,
    whatsappAlready: WHATSAPP_ALREADY_SENT.size,
    slugs: remaining.map((item) => item.slug),
    places: remaining,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const requested = Array.isArray(body.slugs)
    ? body.slugs.filter((item) => typeof item === "string")
    : [];
  const slugs =
    requested.length > 0
      ? requested
      : places.filter(needsSmsOutreach).map((place) => place.slug);

  const httpSmsKey = body.httpSmsKey?.trim() || process.env.HTTPSMS_API_KEY || "";
  const fromPhone = toNumber(body.fromPhone?.trim() || process.env.SMS_FROM_PHONE || "") ?? "";
  const twilioSid = body.twilioSid?.trim() || process.env.TWILIO_ACCOUNT_SID || "";
  const twilioToken = body.twilioToken?.trim() || process.env.TWILIO_AUTH_TOKEN || "";
  const twilioFrom = body.twilioFrom?.trim() || process.env.TWILIO_FROM || fromPhone;

  const useHttp = Boolean(httpSmsKey && fromPhone);
  const useTwilio = Boolean(twilioSid && twilioToken && twilioFrom);
  if (!useHttp && !useTwilio) {
    return NextResponse.json(
      {
        error:
          "Para mandarlos todos desde la compu hace falta HttpSMS (app en tu Samsung) o Twilio. Si no, abrí el enviador en el celular.",
        needsProvider: true,
      },
      { status: 400 }
    );
  }

  const slug = slugs[0];
  if (!slug) {
    return NextResponse.json({ sent: 0, failed: 0, done: true, rows: [] });
  }

  const place = getPlace(slug);
  if (!place) {
    return NextResponse.json({
      sent: 0,
      failed: 1,
      rows: [{ slug, name: slug, ok: false, detail: "No está en la guía." }],
    });
  }
  if (WHATSAPP_ALREADY_SENT.has(slug)) {
    return NextResponse.json({
      sent: 0,
      failed: 0,
      skipped: 1,
      rows: [{ slug, name: place.name, ok: true, detail: "Ya salió por WhatsApp. No se repite." }],
    });
  }
  if (!place.phone) {
    return NextResponse.json({
      sent: 0,
      failed: 1,
      rows: [{ slug, name: place.name, ok: false, detail: "Sin teléfono." }],
    });
  }

  const to = toNumber(place.phone);
  const text = outreachLinkMessage(place);
  if (!to) {
    return NextResponse.json({
      sent: 0,
      failed: 1,
      rows: [{ slug, name: place.name, ok: false, detail: "Número inválido." }],
    });
  }

  try {
    if (useHttp) {
      await sendHttpSms(httpSmsKey, fromPhone, to, text);
    } else {
      await sendTwilio(twilioSid, twilioToken, twilioFrom, to, text);
    }
    return NextResponse.json({
      sent: 1,
      failed: 0,
      rows: [{ slug, name: place.name, ok: true, detail: "SMS salió." }],
    });
  } catch (error) {
    return NextResponse.json({
      sent: 0,
      failed: 1,
      rows: [
        {
          slug,
          name: place.name,
          ok: false,
          detail: error instanceof Error ? error.message : "No salió.",
        },
      ],
    });
  }
}
