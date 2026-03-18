import { NextRequest, NextResponse } from "next/server";
import { upsertContactEvent, EventType } from "@/lib/contacts";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES: EventType[] = ["form_started", "form_completed"];

function fireWebhook(url: string | undefined, body: object): void {
  if (!url) return;
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {
    // fire-and-forget: ignorar errores de webhook
  });
}

/**
 * POST /api/event
 * Registra un evento de contacto y dispara el webhook Zapier correspondiente.
 *
 * Body:
 * {
 *   type: "form_started" | "form_completed",
 *   token?: string,
 *   email?: string,
 *   fecha_evento?: string,
 *   matchAnswers?: string[],
 * }
 */
export async function POST(req: NextRequest) {
  // Same-origin check (en producción Vercel envía Origin)
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { type, token, email, fecha_evento, matchAnswers } = body as Record<string, unknown>;

  if (!type || !ALLOWED_TYPES.includes(type as EventType)) {
    return NextResponse.json(
      { error: `type debe ser uno de: ${ALLOWED_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!token && !email) {
    return NextResponse.json(
      { error: "Se requiere token o email" },
      { status: 400 }
    );
  }

  await upsertContactEvent({
    type: type as EventType,
    token: typeof token === "string" ? token : undefined,
    email: typeof email === "string" ? email : undefined,
    fecha_evento: typeof fecha_evento === "string" ? fecha_evento : undefined,
    match_answers: Array.isArray(matchAnswers)
      ? matchAnswers.map(String)
      : undefined,
  });

  // Disparar webhook Zapier correspondiente (fire-and-forget)
  const webhookPayload = { type, token, email, fecha_evento, matchAnswers };
  if (type === "form_started") {
    fireWebhook(process.env.ZAPIER_WEBHOOK_FORM_STARTED, webhookPayload);
  } else if (type === "form_completed") {
    fireWebhook(process.env.ZAPIER_WEBHOOK_FORM_COMPLETED, webhookPayload);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
