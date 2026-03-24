import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const rawConnectionString = process.env.DATABASE_URL;
if (!rawConnectionString) {
  throw new Error(
    "DATABASE_URL no está definida. Asegúrate de tener un archivo .env con DATABASE_URL."
  );
}

function normalizePostgresSslMode(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get("sslmode");

    // pg advierte que sslmode=require cambiará de semántica en v9.
    // Forzamos verify-full para mantener garantías fuertes y evitar el warning.
    if (sslmode === "require") {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }

    return connectionString;
  } catch {
    // Si no se puede parsear (formato no URL), mantenemos valor original.
    return connectionString;
  }
}

const connectionString = normalizePostgresSslMode(rawConnectionString);

function createPrisma() {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
