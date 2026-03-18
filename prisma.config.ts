import { defineConfig, env } from "prisma/config";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  datasource: {
    url: env("DATABASE_URL"),
  },
});
