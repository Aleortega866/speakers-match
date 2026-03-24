import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/admin/session";
import { getPendingOutreachContacts, markContactsAsSent } from "@/lib/admin/outreach";
import { inviteStartUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  void req; // no body needed

  const session = await getAdminSessionFromCookies();
  if (!session) {
    return NextResponse.json({ ok: false, errorCode: "UNAUTHORIZED", message: "No autorizado" }, { status: 401 });
  }

  const webhookUrl = process.env.ZAPIER_WEBHOOK_OUTREACH?.trim();
  if (!webhookUrl) {
    return NextResponse.json(
      { ok: false, errorCode: "WEBHOOK_NOT_CONFIGURED", message: "ZAPIER_WEBHOOK_OUTREACH no está configurado" },
      { status: 503 }
    );
  }

  const contacts = await getPendingOutreachContacts();
  if (contacts.length === 0) {
    return NextResponse.json({ ok: true, data: { sent: 0 } }, { status: 200 });
  }

  const ids = contacts.map((c) => c.id);

  // Fire-and-forget: disparar webhook por cada contacto sin bloquear
  for (const contact of contacts) {
    const payload = {
      nombre: contact.nombre,
      apellido: contact.apellido,
      empresa: contact.empresa,
      email: contact.email,
      fecha_evento: contact.fecha_evento ?? "",
      invite_url: inviteStartUrl(contact.token),
    };
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // fire-and-forget: ignorar errores individuales
    });
  }

  // Marcar como enviados independientemente del resultado de los fetches
  await markContactsAsSent(ids);

  return NextResponse.json({ ok: true, data: { sent: contacts.length } }, { status: 200 });
}
