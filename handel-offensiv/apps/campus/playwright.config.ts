import { defineConfig, devices } from "@playwright/test";

/**
 * E2E-Smoke-Tests des Campus.
 *
 * Die Tests unter ./e2e laufen OHNE Supabase-Backend (Platzhalter-Env,
 * siehe .github/workflows/handel-offensiv-ci.yml, Job campus-e2e): Sie
 * pruefen nur oeffentliche Seiten, Redirects ohne Sitzung und die
 * Sicherheits-Header. Es wird KEIN gueltiger Login benoetigt.
 *
 *  - baseURL aus E2E_BASE_URL (Default: http://localhost:3001 = `pnpm start`)
 *  - PW_CHROMIUM_PATH: optionaler Pfad zu einer Chromium-Binary, falls die
 *    von Playwright erwartete Revision lokal nicht installiert ist.
 *
 * Der Server wird bewusst nicht per webServer gestartet: Lokal laeuft
 * `pnpm dev:campus` oder der gebaute Stand (`pnpm build:campus && pnpm
 * --filter @handel-offensiv/campus start`); in CI wird der Build im
 * Hintergrund gestartet und mit wait-on abgewartet.
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
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3001",
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
