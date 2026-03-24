import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export interface CsvRow {
  nombre: string;
  apellido: string;
  empresa: string;
  email: string;
  fecha_evento?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

const REQUIRED_COLS = ["nombre", "apellido", "empresa", "email"] as const;

/**
 * Parsea texto CSV en filas validadas.
 * - Soporta \r\n y \n
 * - Primera fila = header
 * - Campos con comas dentro NO están soportados (limitación conocida)
 * - Última fila vacía (trailing newline) se descarta
 */
export function parseCsvText(text: string): { rows: CsvRow[]; parseErrors: string[] } {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  // Descartar última fila si está vacía
  if (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  if (lines.length < 2) {
    return { rows: [], parseErrors: ["El archivo no tiene datos (se requiere header + al menos 1 fila)"] };
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const colIndex: Record<string, number> = {};
  for (const col of [...REQUIRED_COLS, "fecha_evento"]) {
    const idx = header.indexOf(col);
    if (idx !== -1) colIndex[col] = idx;
  }

  // Validar que todas las columnas requeridas estén presentes
  const missingCols = REQUIRED_COLS.filter((col) => colIndex[col] === undefined);
  if (missingCols.length > 0) {
    return {
      rows: [],
      parseErrors: [`Header inválido. Faltan columnas: ${missingCols.join(", ")}`],
    };
  }

  const rows: CsvRow[] = [];
  const parseErrors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1; // 1-indexed para el usuario
    const cells = lines[i].split(",");

    if (cells.length < header.length) {
      parseErrors.push(`Fila ${rowNum}: tiene menos columnas que el header`);
      continue;
    }

    const nombre = cells[colIndex.nombre]?.trim() ?? "";
    const apellido = cells[colIndex.apellido]?.trim() ?? "";
    const empresa = cells[colIndex.empresa]?.trim() ?? "";
    const email = cells[colIndex.email]?.trim() ?? "";
    const fecha_evento = colIndex.fecha_evento !== undefined
      ? cells[colIndex.fecha_evento]?.trim() || undefined
      : undefined;

    if (!nombre) { parseErrors.push(`Fila ${rowNum}: nombre vacío`); continue; }
    if (!apellido) { parseErrors.push(`Fila ${rowNum}: apellido vacío`); continue; }
    if (!empresa) { parseErrors.push(`Fila ${rowNum}: empresa vacía`); continue; }
    if (!email || !email.includes("@") || !email.includes(".")) {
      parseErrors.push(`Fila ${rowNum}: email inválido ("${email}")`);
      continue;
    }

    rows.push({ nombre, apellido, empresa, email, fecha_evento });
  }

  return { rows, parseErrors };
}

/**
 * Genera un token único de 8 chars hex.
 * Reintenta hasta maxAttempts veces si hay colisión.
 */
export async function generateUniqueToken(maxAttempts = 3): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const token = randomBytes(4).toString("hex");
    const existing = await prisma.contact.findFirst({ where: { token }, select: { id: true } });
    if (!existing) return token;
  }
  throw new Error("No se pudo generar un token único después de varios intentos");
}

/**
 * Importa filas de CSV como contactos.
 * Omite filas cuyo email ya existe (case-insensitive).
 */
export async function importContactsFromCsv(rows: CsvRow[]): Promise<ImportResult> {
  let imported = 0;
  let skipped = 0;
  const errors: ImportResult["errors"] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    // Deduplicación por email
    const existing = await prisma.contact.findFirst({
      where: { email: { equals: row.email, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    // Generar token único
    let token: string;
    try {
      token = await generateUniqueToken();
    } catch {
      errors.push({ row: rowNum, reason: "No se pudo generar token único" });
      continue;
    }

    await prisma.contact.create({
      data: {
        nombre: row.nombre,
        apellido: row.apellido,
        empresa: row.empresa,
        email: row.email,
        origen: "outreach",
        token,
        ...(row.fecha_evento ? { fecha_evento: row.fecha_evento } : {}),
      },
    });
    imported++;
  }

  return { imported, skipped, errors };
}

/**
 * Contactos con token asignado y aún no enviados.
 */
export async function getPendingOutreachContacts(): Promise<Array<{
  id: number;
  nombre: string;
  apellido: string;
  empresa: string;
  email: string;
  fecha_evento: string | null;
  token: string;
}>> {
  const contacts = await prisma.contact.findMany({
    where: { token: { not: null }, enviado_at: null },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      empresa: true,
      email: true,
      fecha_evento: true,
      token: true,
    },
  });
  // token no puede ser null aquí por el where, pero TS no lo sabe
  return contacts.filter((c): c is typeof c & { token: string } => c.token !== null);
}

/** Conteo de pendientes (para server-side render inicial). */
export async function getPendingOutreachCount(): Promise<number> {
  return prisma.contact.count({
    where: { token: { not: null }, enviado_at: null },
  });
}

/** Graba enviado_at = now() para todos los ids proporcionados. */
export async function markContactsAsSent(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await prisma.contact.updateMany({
    where: { id: { in: ids } },
    data: { enviado_at: new Date() },
  });
}
