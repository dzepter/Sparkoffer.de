import { expect, test } from "@playwright/test";

/**
 * Basis-Smoke-Tests fuer den Login.
 * Voraussetzung: laufender Dev-Server + lokales Supabase (siehe
 * playwright.config.ts). Es wird KEIN gueltiger Login benoetigt.
 */

test.describe("Login", () => {
  test("Login-Formular wird angezeigt", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /cockpit/i })).toBeVisible();
    await expect(page.getByLabel(/e-mail-adresse/i)).toBeVisible();
    await expect(page.getByLabel(/passwort/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /anmelden/i })).toBeVisible();
  });

  test("Falsche Zugangsdaten zeigen eine deutsche Fehlermeldung ohne Konto-Hinweis", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel(/e-mail-adresse/i).fill("gibtesnicht@example.com");
    await page.getByLabel(/passwort/i).fill("definitiv-falsch-123");
    await page.getByRole("button", { name: /anmelden/i }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("E-Mail-Adresse oder Passwort ist nicht korrekt.");
    // Kein Hinweis, ob die E-Mail-Adresse existiert (Account-Enumeration)
    await expect(alert).not.toContainText(/existiert|unbekannt|kein konto/i);
  });

  test("Ohne Session wird auf /login umgeleitet", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
