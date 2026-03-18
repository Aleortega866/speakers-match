import { prisma } from "./prisma";

/**
 * Comprueba que la conexión a la base de datos responde.
 * Útil para health checks y diagnóstico.
 */
export async function checkDbConnection(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
