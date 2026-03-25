import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const LOCK_KEY = "mailchimp_outreach";
const TTL_MS = 15 * 60 * 1000;

export async function acquireOutreachRunLock(): Promise<
  { ok: true; runId: string } | { ok: false; reason: "ALREADY_RUNNING" }
> {
  const runId = randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + TTL_MS);

  await prisma.outreachRunLock.deleteMany({
    where: { key: LOCK_KEY, expires_at: { lt: now } },
  });

  try {
    await prisma.outreachRunLock.create({
      data: { key: LOCK_KEY, run_id: runId, started_at: now, expires_at: expires },
    });
    return { ok: true, runId };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, reason: "ALREADY_RUNNING" };
    }
    throw e;
  }
}

export async function releaseOutreachRunLock(): Promise<void> {
  await prisma.outreachRunLock.deleteMany({ where: { key: LOCK_KEY } });
}
