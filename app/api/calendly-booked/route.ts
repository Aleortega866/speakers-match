import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/calendly-booked
 *
 * Llamado por Zapier cuando alguien agenda en Calendly.
 * Payload esperado: { email: string, secret?: string }
 *
 * Protegido con secret en query param o body:
 *   POST /api/calendly-booked?secret=<CALENDLY_WEBHOOK_SECRET>
 */
export async function POST(req: NextRequest) {
  // Auth: secret en query param
  const secret = process.env.CALENDLY_WEBHOOK_SECRET?.trim();
  if (secret) {
    const qsSecret = req.nextUrl.searchParams.get("secret");
    if (qsSecret !== secret) {
      return NextResponse.json({ ok: false, errorCode: "UNAUTHORIZED" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errorCode: "INVALID_BODY" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : null;
  if (!email) {
    return NextResponse.json(
      { ok: false, errorCode: "MISSING_EMAIL", message: "Se requiere el campo 'email'" },
      { status: 400 }
    );
  }

  const contact = await prisma.contact.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, calendly_booked_at: true },
  });

  if (!contact) {
    // No existe el contacto — igual devolvemos 200 para que Zapier no reintente
    return NextResponse.json({ ok: true, data: { updated: false, reason: "contact_not_found" } });
  }

  if (contact.calendly_booked_at) {
    // Ya estaba marcado como agendado
    return NextResponse.json({ ok: true, data: { updated: false, reason: "already_booked" } });
  }

  await prisma.contact.update({
    where: { id: contact.id },
    data: { calendly_booked_at: new Date() },
  });

  return NextResponse.json({ ok: true, data: { updated: true, contactId: contact.id } });
}
