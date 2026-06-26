import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Prisma CLI doesn't read .env.local (Next.js convention) — load it explicitly.
config({ path: ".env.local" });

// DIRECT_URL (session-mode pooler, port 5432) is used for migrations.
// DATABASE_URL (transaction-mode pooler, port 6543) is used at runtime via PrismaPg adapter.
export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
