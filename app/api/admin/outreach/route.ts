import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/admin/session";
import { getPendingOutreachContacts, markContactsAsSent } from "@/lib/admin/outreach";
import { acquireOutreachRunLock, releaseOutreachRunLock } from "@/lib/admin/outreachLock";
import { runMailchimpOutreach } from "@/lib/admin/mailchimpOutreach";
import { MailchimpUpstreamError, preflightList, preflightTemplate } from "@/lib/mailchimp";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const REQUIRED_MAILCHIMP_ENV = [
  "MAILCHIMP_API_KEY",
  "MAILCHIMP_AUDIENCE_ID",
  "MAILCHIMP_SERVER_PREFIX",
  "MAILCHIMP_FROM_EMAIL",
  "MAILCHIMP_FROM_NAME",
  "MAILCHIMP_TEMPLATE_ID",
] as const;

const FREE_SEND_LIMIT = 500;

function isMailchimpConfigured(): boolean {
  return REQUIRED_MAILCHIMP_ENV.every((k) => Boolean(process.env[k]?.trim()));
}

export async function POST(req: NextRequest) {
  void req;

  const session = await getAdminSessionFromCookies();
  if (!session) {
    return NextResponse.json({ ok: false, errorCode: "UNAUTHORIZED", message: "No autorizado" }, { status: 401 });
  }

  if (!isMailchimpConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: "MAILCHIMP_NOT_CONFIGURED",
        message: "Mailchimp no está configurado (variables de entorno)",
      },
      { status: 503 }
    );
  }

  const lock = await acquireOutreachRunLock();
  if (!lock.ok) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: "OUTREACH_ALREADY_RUNNING",
        message: "Ya hay una campaña de outreach en curso. Espera unos segundos e intenta de nuevo.",
      },
      { status: 409 }
    );
  }

  const { runId } = lock;

  try {
    const listId = process.env.MAILCHIMP_AUDIENCE_ID!.trim();
    const templateId = process.env.MAILCHIMP_TEMPLATE_ID!.trim();

    try {
      await preflightList(listId, runId);
      await preflightTemplate(templateId, runId);
    } catch (e) {
      if (e instanceof MailchimpUpstreamError) {
        console.error(`[outreach] runId=${runId} preflight`, e.httpStatus, e.mailchimpBody);
        return NextResponse.json(
          {
            ok: false,
            errorCode: "MAILCHIMP_UPSTREAM_ERROR",
            message: "Error al validar Mailchimp (lista o plantilla)",
          },
          { status: 502 }
        );
      }
      throw e;
    }

    const contacts = await getPendingOutreachContacts();
    if (contacts.length === 0) {
      return NextResponse.json({ ok: true, data: { sent: 0, runId } }, { status: 200 });
    }

    if (contacts.length > FREE_SEND_LIMIT) {
      return NextResponse.json(
        {
          ok: false,
          errorCode: "MAILCHIMP_FREE_LIMIT_EXCEEDED",
          message: `Máximo ${FREE_SEND_LIMIT} contactos por envío en el plan gratuito de Mailchimp`,
        },
        { status: 422 }
      );
    }

    let result: { sent: number; campaignId: string; segmentId: number };
    try {
      result = await runMailchimpOutreach(contacts, runId);
    } catch (e) {
      if (e instanceof MailchimpUpstreamError) {
        console.error(`[outreach] runId=${runId} upstream`, e.httpStatus, e.mailchimpBody);
        return NextResponse.json(
          {
            ok: false,
            errorCode: "MAILCHIMP_UPSTREAM_ERROR",
            message: "Error al enviar con Mailchimp",
          },
          { status: 502 }
        );
      }
      throw e;
    }

    const ids = contacts.map((c) => c.id);
    try {
      await markContactsAsSent(ids);
    } catch (markErr) {
      console.error(`[outreach] runId=${runId} markContactsAsSent failed`, markErr);
      await prisma.outreachReconciliation.create({
        data: {
          run_id: runId,
          campaign_id: result.campaignId,
          contact_ids_json: JSON.stringify(ids),
          status: "pending",
        },
      });
      return NextResponse.json(
        {
          ok: false,
          errorCode: "OUTREACH_RECONCILIATION_REQUIRED",
          message:
            "Mailchimp envió la campaña pero no se pudo actualizar la base de datos. Se registró una tarea de reconciliación.",
        },
        { status: 500 }
      );
    }

    console.log(
      `[outreach] runId=${runId} sent=${result.sent} campaignId=${result.campaignId} segmentId=${result.segmentId}`
    );

    return NextResponse.json({
      ok: true,
      data: {
        sent: result.sent,
        runId,
        campaignId: result.campaignId,
        ...(contacts.length > 400 ? { warning: "Cercano al límite del plan gratuito" } : {}),
      },
    });
  } finally {
    await releaseOutreachRunLock();
  }
}
