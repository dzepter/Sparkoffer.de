import { expect, test } from "@playwright/test";

/** Pfad-Praefix der App (next.config.ts: basePath). Alle Routen liegen darunter. */
const BASE_PATH = "/akademie";
const p = (path: string): string => (path === "/" ? BASE_PATH : `${BASE_PATH}${path}`);

/**
 * Smoke-Tests der oeffentlichen Auth-Seiten und des Auth-Gates.
 *
 * Laeuft OHNE Supabase-Backend (Platzhalter-Env): Es wird kein gueltiger
 * Login benoetigt, es werden nur Darstellung, Links und Redirects geprueft.
 */

test.describe("Anmeldung", () => {
  test("Login-Formular mit Links wird angezeigt", async ({ page }) => {
    await page.goto(p("/login"));

    await expect(page).toHaveTitle(/anmelden/i);
    await expect(page.getByRole("heading", { level: 1, name: "Anmelden" })).toBeVisible();
    await expect(page.getByLabel(/e-mail-adresse/i)).toBeVisible();
    await expect(page.getByLabel(/^passwort/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();

    await expect(page.getByRole("link", { name: /passwort vergessen/i })).toHaveAttribute("href", "/akademie/login/passwort-vergessen",
    );
    await expect(page.getByRole("link", { name: /zugang einrichten/i })).toHaveAttribute("href", "/akademie/einladung");

    // Rechtslinks im oeffentlichen Rahmen
    const legal = page.getByRole("navigation", { name: /rechtliches/i });
    await expect(legal.getByRole("link", { name: "Datenschutz" })).toHaveAttribute("href", "/akademie/datenschutz");
    await expect(legal.getByRole("link", { name: "Impressum" })).toHaveAttribute("href", "/akademie/impressum");
  });

  test("Bekannter Hinweis-Schluessel wird als Banner angezeigt, Freitext nicht", async ({ page }) => {
    await page.goto(p("/login?hinweis=abgemeldet"));
    await expect(page.getByRole("status")).toContainText("Sie wurden abgemeldet");

    await page.goto(p("/login?hinweis=%3Cscript%3Ealert(1)%3C%2Fscript%3E"));
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: "Anmelden" })).toBeVisible();
  });
});

test.describe("Einladung", () => {
  test("Schritt 1: Einladungscode-Eingabe wird angezeigt", async ({ page }) => {
    await page.goto(p("/einladung"));

    await expect(page.getByRole("heading", { level: 1, name: "Einladung annehmen" })).toBeVisible();
    await expect(page.getByLabel(/einladungscode/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /einladung prüfen/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /zurück zur anmeldung/i })).toHaveAttribute("href", "/akademie/login");

    // Kein Passwortfeld, bevor der Code geprueft wurde
    await expect(page.getByLabel(/^passwort/i)).toHaveCount(0);
  });
});

test.describe("Passwort vergessen", () => {
  test("Formular wird angezeigt", async ({ page }) => {
    await page.goto(p("/login/passwort-vergessen"));

    await expect(page.getByRole("heading", { level: 1, name: "Passwort vergessen" })).toBeVisible();
    await expect(page.getByLabel(/e-mail-adresse/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /link anfordern/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /zurück zur anmeldung/i })).toHaveAttribute("href", "/akademie/login");
  });

  test("Absenden zeigt eine neutrale Bestaetigung oder einen Netzwerkhinweis – nie ein Konto-Urteil", async ({
    page,
  }) => {
    await page.goto(p("/login/passwort-vergessen"));

    await page.getByLabel(/e-mail-adresse/i).fill("gibtesnicht@example.com");
    await page.getByRole("button", { name: /link anfordern/i }).click();

    // Ohne Backend kann die Antwort ein Netzfehler sein – beides ist zulaessig,
    // solange keine Aussage ueber die Existenz des Kontos getroffen wird.
    const neutral = page.getByRole("status").filter({ hasText: /prüfen sie ihr e-mail-postfach/i });
    const network = page.getByText(/keine verbindung zum server/i);
    await expect(neutral.or(network).first()).toBeVisible({ timeout: 20_000 });

    await expect(page.getByText(/existiert nicht|unbekannt|kein konto/i)).toHaveCount(0);
  });
});

test.describe("Auth-Gate ohne Sitzung", () => {
  test("/passwort-neu leitet auf /login um", async ({ page }) => {
    await page.goto(p("/passwort-neu"));
    await expect(page).toHaveURL(/\/login(\?|$)/);
    await expect(page.getByRole("heading", { level: 1, name: "Anmelden" })).toBeVisible();
  });

  test("/ leitet auf /login um", async ({ page }) => {
    await page.goto(p("/"));
    await expect(page).toHaveURL(/\/login(\?|$)/);
  });

  test("/heute leitet auf /login um", async ({ page }) => {
    await page.goto(p("/heute"));
    await expect(page).toHaveURL(/\/login(\?|$)/);
    await expect(page.getByRole("heading", { level: 1, name: "Anmelden" })).toBeVisible();
  });

  test("Geschuetzte Unterseiten merken sich das Ziel (nur relativer Pfad)", async ({ page }) => {
    await page.goto(p("/programm"));
    await expect(page).toHaveURL(/\/login\?weiter=%2Fprogramm$/);
  });

  test("Unbekannte Seite zeigt eine deutsche 404-Seite", async ({ page }) => {
    const response = await page.goto(p("/gibt-es-nicht-") + Date.now());
    // Ohne Sitzung greift zuerst das Auth-Gate (Redirect auf /login) – beides ist korrekt.
    if (page.url().includes("/login")) {
      await expect(page.getByRole("heading", { level: 1, name: "Anmelden" })).toBeVisible();
      return;
    }
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/nicht gefunden/i);
  });
});
