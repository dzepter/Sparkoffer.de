import { defineConfig } from "vitest/config";

/**
 * RLS-Tests laufen strikt sequenziell gegen EINE Datenbank:
 * - globalSetup setzt die DB zurueck und spielt Shim + Migrationen + Fixtures ein
 * - jeder Test laeuft in einer Transaktion, die am Ende zurueckgerollt wird
 */
export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
    globalSetup: ["./src/global-setup.ts"],
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 30_000,
    hookTimeout: 120_000,
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: { junit: "./reports/rls-junit.xml" },
  },
});
