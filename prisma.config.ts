import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

dotenv.config();

// DATABASE_URL puede no estar disponible durante `prisma generate` en CI/build.
// Solo incluimos datasource cuando la variable existe (migraciones en local o Vercel CLI).
const datasource = process.env.DATABASE_URL
  ? {
      datasource: {
        url: process.env.DATABASE_URL,
        ...(process.env.DIRECT_URL ? { directUrl: process.env.DIRECT_URL } : {}),
      },
    }
  : {};

export default defineConfig({
  migrations: {
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  ...datasource,
});
