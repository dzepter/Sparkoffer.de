import { defineConfig, devices } from "@playwright/test";

/**
 * E2E-Basis-Setup.
 * baseURL kommt aus E2E_BASE_URL (Default: lokaler Dev-Server).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    locale: "de-DE",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /*
   * webServer bewusst auskommentiert: Die Tests setzen einen bereits
   * laufenden Stack voraus (lokal: `supabase start` + `pnpm dev` in
   * apps/admin, inkl. .env.local mit den Supabase-Keys). Fuer einen
   * automatischen Start einkommentieren:
   *
   * webServer: {
   *   command: "pnpm dev",
   *   url: "http://localhost:3000",
   *   reuseExistingServer: !process.env.CI,
   *   timeout: 120_000,
   * },
   */
});
