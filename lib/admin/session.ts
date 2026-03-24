import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SEC,
} from "@/lib/admin/session-constants";

export function hashSessionToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function generateRawSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function getAdminSessionFromCookies(): Promise<{
  userId: number;
  email: string;
  role: string;
} | null> {
  const jar = await cookies();
  const raw = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (!raw) return null;

  const tokenHash = hashSessionToken(raw);
  const now = new Date();

  const session = await prisma.adminSession.findFirst({
    where: {
      session_token_hash: tokenHash,
      expires_at: { gt: now },
    },
    include: {
      admin_user: true,
    },
  });

  if (!session?.admin_user?.active || session.admin_user.role !== "admin") {
    return null;
  }

  return {
    userId: session.admin_user.id,
    email: session.admin_user.email,
    role: session.admin_user.role,
  };
}

export function sessionCookieOptions(expiresAt: Date): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  expires: Date;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  };
}

export { ADMIN_SESSION_MAX_AGE_SEC, ADMIN_SESSION_COOKIE };
