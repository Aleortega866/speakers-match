import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/admin/session";
import { parseCsvText, importContactsFromCsv } from "@/lib/admin/outreach";

export const dynamic = "force-dynamic";

const MAX_ROWS = 500;

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromCookies();
  if (!session) {
    return NextResponse.json({ ok: false, errorCode: "UNAUTHORIZED", message: "No autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, errorCode: "INVALID_BODY", message: "Body inválido" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ ok: false, errorCode: "NO_FILE", message: "Se requiere un archivo CSV" }, { status: 400 });
  }

  const text = await file.text();
  const { rows, parseErrors } = parseCsvText(text);

  if (rows.length === 0) {
    return NextResponse.json(
      { ok: false, errorCode: "NO_VALID_ROWS", message: "No se encontraron filas válidas", data: { parseErrors } },
      { status: 400 }
    );
  }

  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { ok: false, errorCode: "TOO_MANY_ROWS", message: `Máximo ${MAX_ROWS} filas por importación` },
      { status: 422 }
    );
  }

  const result = await importContactsFromCsv(rows);

  return NextResponse.json({ ok: true, data: { ...result, parseErrors } }, { status: 200 });
}
