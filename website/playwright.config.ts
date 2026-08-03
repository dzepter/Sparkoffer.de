import { defineConfig, devices } from "@playwright/test";

/**
 * E2E-Tests gegen den Produktions-Build (`pnpm build` vorher ausführen).
 * In Sandbox-/CI-Umgebungen kann über CHROMIUM_EXECUTABLE_PATH ein
 * vorinstallierter Chromium verwendet werden.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3111",
    trace: "on-first-retry",
    ...(process.env.CHROMIUM_EXECUTABLE_PATH
      ? {
          launchOptions: {
            executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
          },
        }
      : {}),
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm start -p 3111",
    url: "http://localhost:3111",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      // Tests laufen ohne SMTP-Zugangsdaten und mit entschärftem Rate-Limit
      CONTACT_DEV_ACCEPT: "true",
      CONTACT_RATE_LIMIT_MAX: "1000",
    },
  },
});
