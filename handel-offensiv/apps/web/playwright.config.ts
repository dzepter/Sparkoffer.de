import { defineConfig, devices } from "@playwright/test";

/**
 * Integrations-Smoke-Tests der Website-Shell (eine Domain, drei Apps).
 *
 * Voraussetzung: drei laufende Server OHNE Supabase-Backend (Platzhalter-Env):
 *   - Shell     http://localhost:3100  (AKADEMIE_ZONE_URL / ADMIN_ZONE_URL zeigen auf 3001 / 3000)
 *   - Akademie  http://localhost:3001  (basePath /akademie)
 *   - Cockpit   http://localhost:3000  (basePath /admin)
 * Siehe .github/workflows/handel-offensiv-ci.yml, Job integration-e2e.
 *
 * PW_CHROMIUM_PATH: optionaler Pfad zu einer Chromium-Binary.
 */
const chromiumPath = process.env.PW_CHROMIUM_PATH;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "on-first-retry",
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
