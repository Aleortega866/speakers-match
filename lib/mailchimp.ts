import { createHash } from "crypto";

const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MailchimpUpstreamError extends Error {
  constructor(
    message: string,
    public readonly httpStatus?: number,
    public readonly mailchimpBody?: string
  ) {
    super(message);
    this.name = "MailchimpUpstreamError";
  }
}

export function subscriberHash(email: string): string {
  return createHash("md5").update(email.trim().toLowerCase()).digest("hex");
}

function getAuthHeader(): string {
  const key = process.env.MAILCHIMP_API_KEY?.trim();
  if (!key) throw new MailchimpUpstreamError("MAILCHIMP_API_KEY ausente");
  const token = Buffer.from(`any:${key}`).toString("base64");
  return `Basic ${token}`;
}

function baseUrl(): string {
  const prefix = process.env.MAILCHIMP_SERVER_PREFIX?.trim();
  if (!prefix) throw new MailchimpUpstreamError("MAILCHIMP_SERVER_PREFIX ausente");
  return `https://${prefix}.api.mailchimp.com/3.0`;
}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.slice(0, 2000);
  } catch {
    return "";
  }
}

async function mailchimpRequest(
  path: string,
  init: RequestInit,
  runId?: string
): Promise<Response> {
  const url = `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: HeadersInit = {
    Authorization: getAuthHeader(),
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...init.headers,
  };

  let lastRes: Response | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, { ...init, headers });
    lastRes = res;

    if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
      if (attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        if (runId) console.error(`[mailchimp] runId=${runId} retry ${attempt + 1} after ${delay}ms status=${res.status}`);
        await sleep(delay);
        continue;
      }
    }

    return res;
  }

  return lastRes!;
}

async function expectOk(res: Response, context: string, runId?: string): Promise<void> {
  if (res.ok) return;
  const body = await parseErrorBody(res);
  if (runId) console.error(`[mailchimp] runId=${runId} ${context} status=${res.status} body=${body}`);
  throw new MailchimpUpstreamError(
    `Mailchimp: ${context} falló (${res.status})`,
    res.status,
    body
  );
}

export async function preflightList(listId: string, runId?: string): Promise<void> {
  const res = await mailchimpRequest(`/lists/${encodeURIComponent(listId)}`, { method: "GET" }, runId);
  await expectOk(res, "GET list", runId);
}

export async function preflightTemplate(templateId: string, runId?: string): Promise<void> {
  const res = await mailchimpRequest(`/templates/${encodeURIComponent(templateId)}`, { method: "GET" }, runId);
  await expectOk(res, "GET template", runId);
}

export interface MailchimpMergeFields {
  FNAME: string;
  LNAME: string;
  EMPRESA: string;
  INVITE_URL: string;
}

export async function upsertMember(
  listId: string,
  email: string,
  mergeFields: MailchimpMergeFields,
  runId?: string
): Promise<void> {
  const hash = subscriberHash(email);
  const body = JSON.stringify({
    email_address: email,
    status_if_new: "subscribed",
    merge_fields: mergeFields,
  });
  const res = await mailchimpRequest(
    `/lists/${encodeURIComponent(listId)}/members/${hash}`,
    { method: "PUT", body },
    runId
  );
  await expectOk(res, `PUT member ${email}`, runId);
}

export async function createStaticSegment(
  listId: string,
  name: string,
  emails: string[],
  runId?: string
): Promise<number> {
  const body = JSON.stringify({
    name,
    static_segment: emails,
  });
  const res = await mailchimpRequest(
    `/lists/${encodeURIComponent(listId)}/segments`,
    { method: "POST", body },
    runId
  );
  await expectOk(res, "POST segment", runId);
  const json = (await res.json()) as { id?: number };
  if (typeof json.id !== "number") {
    throw new MailchimpUpstreamError("Mailchimp: segmento sin id");
  }
  return json.id;
}

export async function createRegularCampaign(
  listId: string,
  savedSegmentId: number,
  settings: { subjectLine: string; title: string; fromName: string; replyTo: string },
  runId?: string
): Promise<string> {
  const payload = {
    type: "regular",
    recipients: {
      list_id: listId,
      segment_opts: { saved_segment_id: savedSegmentId },
    },
    settings: {
      subject_line: settings.subjectLine,
      title: settings.title,
      from_name: settings.fromName,
      reply_to: settings.replyTo,
    },
  };
  const res = await mailchimpRequest(`/campaigns`, { method: "POST", body: JSON.stringify(payload) }, runId);
  await expectOk(res, "POST campaign", runId);
  const json = (await res.json()) as { id?: string };
  if (!json.id) throw new MailchimpUpstreamError("Mailchimp: campaña sin id");
  return json.id;
}

export async function setCampaignTemplate(
  campaignId: string,
  templateId: number,
  runId?: string
): Promise<void> {
  const body = JSON.stringify({
    template: { id: templateId },
  });
  const res = await mailchimpRequest(
    `/campaigns/${encodeURIComponent(campaignId)}/content`,
    { method: "PUT", body },
    runId
  );
  await expectOk(res, "PUT campaign content", runId);
}

export async function sendCampaignMailchimp(campaignId: string, runId?: string): Promise<void> {
  const res = await mailchimpRequest(
    `/campaigns/${encodeURIComponent(campaignId)}/actions/send`,
    { method: "POST" },
    runId
  );
  await expectOk(res, "POST campaign send", runId);
}
