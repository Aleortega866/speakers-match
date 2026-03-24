import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  hashSessionToken,
} from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const jar = await cookies();
  const raw = jar.get(ADMIN_SESSION_COOKIE)?.value;

  if (raw) {
    const tokenHash = hashSessionToken(raw);
    await prisma.adminSession.deleteMany({
      where: { session_token_hash: tokenHash },
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
