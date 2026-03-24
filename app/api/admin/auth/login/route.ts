import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyScryptPassword } from "@/lib/admin/password";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SEC,
  generateRawSessionToken,
  hashSessionToken,
  sessionCookieOptions,
} from "@/lib/admin/session";

export const dynamic = "force-dynamic";

function sameOriginOk(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!sameOriginOk(req)) {
    return NextResponse.json({ ok: false, errorCode: "FORBIDDEN", message: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errorCode: "INVALID_BODY", message: "Body invalido" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, errorCode: "INVALID_BODY", message: "Body invalido" }, { status: 400 });
  }

  const { email, password } = body as Record<string, unknown>;
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return NextResponse.json(
      { ok: false, errorCode: "VALIDATION", message: "Email y contrasena requeridos" },
      { status: 422 }
    );
  }

  const user = await prisma.adminUser.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
  });

  if (!user?.active || user.role !== "admin") {
    return NextResponse.json(
      { ok: false, errorCode: "AUTH", message: "Credenciales incorrectas" },
      { status: 401 }
    );
  }

  if (!verifyScryptPassword(password, user.password_hash)) {
    return NextResponse.json(
      { ok: false, errorCode: "AUTH", message: "Credenciales incorrectas" },
      { status: 401 }
    );
  }

  const rawToken = generateRawSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE_SEC * 1000);

  await prisma.adminSession.create({
    data: {
      user_id: user.id,
      session_token_hash: tokenHash,
      expires_at: expiresAt,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
    },
  });

  const res = NextResponse.json({ ok: true, data: { email: user.email } });
  res.cookies.set(ADMIN_SESSION_COOKIE, rawToken, sessionCookieOptions(expiresAt));
  return res;
}
