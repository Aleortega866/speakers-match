import { NextRequest, NextResponse } from "next/server";
import { findContactByToken } from "@/lib/contacts";

export const dynamic = "force-dynamic";

/**
 * GET /api/contact?t={token}
 * Retorna datos básicos del contacto para precarga del formulario.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");

  if (!token || token.trim() === "") {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const contact = await findContactByToken(token.trim());

  if (!contact) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  return NextResponse.json(contact, { status: 200 });
}
