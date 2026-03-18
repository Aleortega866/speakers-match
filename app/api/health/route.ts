import { NextResponse } from "next/server";
import { checkDbConnection } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — Comprueba conectividad con la base de datos.
 * Responde 200 si la BD responde, 503 si no.
 */
export async function GET() {
  const result = await checkDbConnection();

  if (result.ok) {
    return NextResponse.json(
      { status: "ok", db: "connected" },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { status: "error", db: "disconnected", error: result.error },
    { status: 503 }
  );
}
