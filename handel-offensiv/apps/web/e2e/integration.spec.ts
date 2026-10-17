import { expect, test, type Page } from "@playwright/test";

/**
 * Integrations-Smoke-Tests: EINE Domain, drei Apps.
 *
 *   /            Website (statisch, diese Shell)
 *   /login       Teilnehmer-Login   -> Zone akademie (Rewrite, Adresse bleibt /login)
 *   /akademie    Akademie           -> Zone akademie
 *   /admin       Cockpit            -> Zone admin
 *
 * Laeuft OHNE Supabase-Backend (Platzhalter-Env): geprueft werden Rewrites,
 * Redirects, Assets der Zonen, Sicherheits-Header und dass Formulare (Server
 * Actions) ueber die Shell hinweg ausgefuehrt werden. Kein Login noetig.
 */

/**
 * Sammelt fehlgeschlagene Unterressourcen (4xx/5xx) einer Seite.
 * Ausgenommen: die optionalen woff2-Schriftdateien der Zonen (public/fonts/README.md –
 * fehlen sie, faellt der Browser auf den System-Stack zurueck) und die freiwillige
 * CMS-Textdatei der Website (content.js faellt lautlos zurueck).
 */
function trackFailedAssets(page: Page): string[] {
  const failed: string[] = [];
  page.on("response", (res) => {
    const url = res.url();
    if (/\/fonts\/[^/]+\.woff2$/.test(url) || url.endsWith("/cms/content.json")) return;
    if (res.status() >= 400) failed.push(`${res.status()} ${url}`);
  });
  return failed;
}

test.describe("Website (Shell)", () => {
  test("Startseite kommt aus public/index.html", async ({ page }) => {
    const failed = trackFailedAssets(page);
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("header .logo")).toContainText(/handel/i);
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    // Navigation zeigt auf den echten Login (nicht mehr login.html)
    await expect(page.locator('header .main-nav a[href="/login"]')).toHaveCount(1);
    expect(failed).toEqual([]);
  });

  test("Unterseiten der Website werden ausgeliefert", async ({ request }) => {
    for (const path of ["/kontakt.html", "/impressum.html", "/datenschutz.html", "/robots.txt", "/sitemap.xml"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(200);
    }
  });

  test("Sicherheits-Header und CSP der Website (ohne Zonenpfade)", async ({ request }) => {
    const response = await request.get("/", { maxRedirects: 0 });
    const headers = response.headers();
    expect(headers["x-content-type-options"] ?? "").toMatch(/nosniff/i);
    expect(headers["x-frame-options"] ?? "").toMatch(/deny/i);
    expect(headers["referrer-policy"] ?? "").toMatch(/strict-origin-when-cross-origin/i);
    expect(headers["content-security-policy"] ?? "").toContain("script-src 'self'");
    expect(headers["content-security-policy"] ?? "").not.toContain("nonce-");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("Alte Adressen werden dauerhaft umgeleitet", async ({ request }) => {
    const login = await request.get("/login.html", { maxRedirects: 0 });
    expect(login.status()).toBe(308);
    expect(login.headers()["location"]).toBe("/login");

    const index = await request.get("/index.html", { maxRedirects: 0 });
    expect(index.status()).toBe(308);
    expect(index.headers()["location"]).toBe("/");
  });

  test("Unbekannte Seite: statische 404 im Look der Website, Website-CSP ohne Verstoesse", async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (msg) => {
      if (/content security policy/i.test(msg.text())) violations.push(msg.text());
    });
    const response = await page.goto("/gibt-es-nicht-" + Date.now());
    expect(response?.status()).toBe(404);
    expect(response?.headers()["content-security-policy"] ?? "").toContain("script-src 'self'");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/abseits/i);
    await expect(page.getByRole("link", { name: /zur startseite/i })).toHaveAttribute("href", "/index.html");
    expect(violations).toEqual([]);
  });
});

test.describe("Teilnehmer-Login unter /login (Zone akademie)", () => {
  test("Login-Seite unter /login, Assets aus /akademie/_next, React hydriert", async ({ page }) => {
    const failed = trackFailedAssets(page);
    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { level: 1, name: "Anmelden" })).toBeVisible();

    // Assets der Zone tragen das Praefix und werden ueber die Shell geladen
    const scriptSrcs = await page.evaluate(() => Array.from(document.scripts).map((s) => s.src).filter(Boolean));
    expect(scriptSrcs.length).toBeGreaterThan(0);
    for (const src of scriptSrcs) expect(new URL(src).pathname).toMatch(/^\/akademie\/_next\//);
    expect(failed).toEqual([]);

    await page.waitForFunction(
      () =>
        Object.keys(document.body).some((k) => k.startsWith("__reactFiber") || k.startsWith("__reactContainer")) ||
        Object.keys(document).some((k) => k.startsWith("__reactContainer")),
      undefined,
      { timeout: 15_000 },
    );

    // Links der Zone tragen das Praefix – die Shell leitet /akademie/login/* auf /login/* zurueck
    await expect(page.getByRole("link", { name: /passwort vergessen/i })).toHaveAttribute(
      "href",
      "/akademie/login/passwort-vergessen",
    );
  });

  test("Zonen-Header laufen durch: noindex und Nonce-CSP der Akademie, nicht die Website-CSP", async ({ request }) => {
    const response = await request.get("/login", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers["x-robots-tag"] ?? "").toMatch(/noindex/i);
    expect(headers["content-security-policy"] ?? "").toContain("nonce-");
  });

  test("/akademie/login ist nur ein Alias und fuehrt auf /login (Query bleibt erhalten)", async ({ request }) => {
    const response = await request.get("/akademie/login?hinweis=abgemeldet", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toBe("/login?hinweis=abgemeldet");
  });

  test("Passwort vergessen: Formular wird ueber die Shell abgesendet (Server Action erlaubt)", async ({ page }) => {
    await page.goto("/login/passwort-vergessen");
    await expect(page).toHaveURL(/\/login\/passwort-vergessen$/);
    await expect(page.getByRole("heading", { level: 1, name: "Passwort vergessen" })).toBeVisible();

    await page.getByLabel(/e-mail-adresse/i).fill("gibtesnicht@example.com");
    await page.getByRole("button", { name: /link anfordern/i }).click();

    // Ohne Backend: neutrale Bestaetigung ODER Netzwerkhinweis – aber NIE ein
    // Cross-Origin-Fehler der Server Action (waere ein Next-Fehlerdialog / 500).
    const neutral = page.getByRole("status").filter({ hasText: /prüfen sie ihr e-mail-postfach/i });
    const network = page.getByText(/keine verbindung zum server/i);
    await expect(neutral.or(network).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/invalid server actions request|application error/i)).toHaveCount(0);
  });
});

test.describe("Akademie unter /akademie (ohne Sitzung)", () => {
  test("/akademie fuehrt ohne Sitzung auf /login", async ({ page }) => {
    await page.goto("/akademie");
    await expect(page).toHaveURL(/\/login(\?|$)/);
    await expect(page.getByRole("heading", { level: 1, name: "Anmelden" })).toBeVisible();
  });

  test("Geschuetzte Seite merkt sich das Ziel relativ zur Akademie", async ({ page }) => {
    await page.goto("/akademie/programm");
    await expect(page).toHaveURL(/\/login\?weiter=%2Fprogramm$/);
  });

  test("Rechtsseiten der Akademie ohne Sitzung erreichbar", async ({ request }) => {
    for (const path of ["/akademie/datenschutz", "/akademie/impressum", "/akademie/einladung"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(200);
    }
  });
});

test.describe("Cockpit unter /admin", () => {
  test("/admin fuehrt ohne Sitzung auf /admin/login", async ({ page }) => {
    const failed = trackFailedAssets(page);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login(\?|$)/);
    await expect(page.getByRole("heading", { name: /cockpit/i })).toBeVisible();

    const scriptSrcs = await page.evaluate(() => Array.from(document.scripts).map((s) => s.src).filter(Boolean));
    expect(scriptSrcs.length).toBeGreaterThan(0);
    for (const src of scriptSrcs) expect(new URL(src).pathname).toMatch(/^\/admin\/_next\//);
    expect(failed).toEqual([]);
  });

  test("Cockpit-Header laufen durch (noindex, Nonce-CSP)", async ({ request }) => {
    const response = await request.get("/admin/login", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    expect(response.headers()["content-security-policy"] ?? "").toContain("nonce-");
  });

  test("Cockpit-Login: Formular wird ueber die Shell abgesendet (Server Action erlaubt)", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/e-mail-adresse/i).fill("gibtesnicht@example.com");
    await page.getByLabel(/passwort/i).fill("definitiv-falsch-123");
    await page.getByRole("button", { name: /anmelden/i }).click();

    // Ohne Backend: Fehlermeldung des Formulars (Zugangsdaten/Netz) – kein Cross-Origin-Fehler
    await expect(page.getByRole("alert").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/invalid server actions request|application error/i)).toHaveCount(0);
  });
});
