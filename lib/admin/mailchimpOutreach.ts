import { inviteStartUrl } from "@/lib/site";
import {
  createRegularCampaign,
  createStaticSegment,
  sendCampaignMailchimp,
  setCampaignTemplate,
  upsertMember,
} from "@/lib/mailchimp";

export interface PendingOutreachContact {
  id: number;
  nombre: string;
  apellido: string;
  empresa: string;
  email: string;
  fecha_evento: string | null;
  token: string;
}

/**
 * Upsert de miembros → segmento estático → campaña con template → send.
 * Preflight (lista + template) debe ejecutarse antes en el route.
 */
export async function runMailchimpOutreach(
  contacts: PendingOutreachContact[],
  runId: string
): Promise<{ sent: number; campaignId: string; segmentId: number }> {
  const listId = process.env.MAILCHIMP_AUDIENCE_ID!.trim();
  const templateId = Number(process.env.MAILCHIMP_TEMPLATE_ID!.trim());
  const fromEmail = process.env.MAILCHIMP_FROM_EMAIL!.trim();
  const fromName = process.env.MAILCHIMP_FROM_NAME!.trim();
  const subject = process.env.MAILCHIMP_SUBJECT_LINE?.trim() || "Invitación SpeakerMatch";

  if (!Number.isFinite(templateId)) {
    throw new Error("MAILCHIMP_TEMPLATE_ID inválido");
  }

  for (const c of contacts) {
    await upsertMember(
      listId,
      c.email,
      {
        FNAME: c.nombre,
        LNAME: c.apellido,
        EMPRESA: c.empresa,
        INVITE_URL: inviteStartUrl(c.token),
      },
      runId
    );
  }

  const segmentName = `outreach_${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const emails = contacts.map((c) => c.email);
  const segmentId = await createStaticSegment(listId, segmentName, emails, runId);

  const campaignId = await createRegularCampaign(
    listId,
    segmentId,
    {
      subjectLine: subject,
      title: segmentName,
      fromName,
      replyTo: fromEmail,
    },
    runId
  );

  await setCampaignTemplate(campaignId, templateId, runId);
  await sendCampaignMailchimp(campaignId, runId);

  return { sent: contacts.length, campaignId, segmentId };
}
