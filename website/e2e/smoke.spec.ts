import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", h1: /Handel\s*Offensiv/i },
  { path: "/handel-offensiv", h1: /Was ist Handel Offensiv/i },
  { path: "/offensivtage", h1: /fünf Offensivtage/i },
  { path: "/fuer-unternehmen", h1: /Führungskräfteentwicklung/i },
  { path: "/rainer-aigner", h1: /Zuschauertribüne/i },
  { path: "/impulse", h1: /Impuls/i },
  { path: "/kontakt", h1: /am Zug/i },
  { path: "/impressum", h1: /Impressum/i },
  { path: "/datenschutz", h1: /Datenschutzerklärung/i },
];

for (const { path, h1 } of pages) {
  test(`Seite ${path} lädt mit genau einer H1 und ohne Konsolenfehler`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const response = await page.goto(path);
    expect(response?.status()).toBe(200);

    const headings = page.locator("h1");
    await expect(headings).toHaveCount(1);
    await expect(headings.first()).toContainText(h1);

    // html lang="de" und Titel vorhanden
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    expect(await page.title()).not.toEqual("");

    expect(consoleErrors).toEqual([]);
  });
}

test("Unbekannte URL zeigt die individuelle 404-Seite", async ({ page }) => {
  const response = await page.goto("/diese-seite-gibt-es-nicht");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toContainText(/Aufstellung/i);
  await expect(
    page.getByRole("link", { name: "Zur Startseite" })
  ).toBeVisible();
});

test("Sitemap und robots.txt sind erreichbar", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("/offensivtage");

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("sitemap.xml");
});

test("Alte WordPress-URLs werden weitergeleitet", async ({ request }) => {
  const cases = [
    { from: "/learn-to-lead", to: "/handel-offensiv" },
    { from: "/uber-uns", to: "/rainer-aigner" },
    { from: "/vortraege", to: "/impulse" },
    { from: "/potentiale-steuern", to: "/fuer-unternehmen" },
    { from: "/blog", to: "/impulse" },
  ];
  for (const { from, to } of cases) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status(), `${from} → ${to}`).toBe(308);
    expect(response.headers()["location"], `${from} → ${to}`).toBe(to);
  }
});

test("Hauptnavigation funktioniert per Tastatur", async ({ page }) => {
  await page.goto("/");
  // Skip-Link ist das erste fokussierbare Element
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Zum Inhalt springen" })
  ).toBeFocused();
});

test("Keine Seite erzeugt horizontalen Scroll auf kleinen Displays", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 360, height: 780 },
  });
  const page = await context.newPage();
  for (const { path } of pages) {
    await page.goto(`http://localhost:3111${path}`, {
      waitUntil: "networkidle",
    });
    const { scrollW, innerW } = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
    }));
    expect(scrollW, `${path} überläuft horizontal`).toBeLessThanOrEqual(
      innerW
    );
  }
  await context.close();
});

test("Inhalte sind bei reduzierter Bewegung sofort sichtbar", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // Abschnitt weit unterhalb des sichtbaren Bereichs – ohne Scrollen prüfbar
  const faqHeading = page.getByRole("heading", { name: "Häufige Fragen" });
  await expect(faqHeading).toHaveCSS("opacity", "1");
});

test("Inhalte sind ohne JavaScript vollständig sichtbar", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://localhost:3111/");
  const heading = page.getByRole("heading", { name: "Häufige Fragen" });
  await expect(heading).toHaveCSS("opacity", "1");
  // FAQ funktioniert als natives details/summary auch ohne JS
  const firstFaq = page.locator("details").first();
  await firstFaq.locator("summary").click();
  await expect(firstFaq).toHaveAttribute("open", "");
  await context.close();
});

test("Kontaktformular ist ohne JavaScript vorhanden und vorausgewählt", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://localhost:3111/kontakt?angebot=fuehrerschein");
  await expect(page.getByLabel("Name", { exact: false }).first()).toBeVisible();
  await expect(page.getByLabel("Ihre Nachricht")).toBeVisible();
  await expect(page.getByLabel("Gewünschtes Angebot")).toHaveValue(
    "fuehrerschein"
  );
  await expect(
    page.getByRole("button", { name: "Anfrage senden" })
  ).toBeVisible();
  await context.close();
});

test("Strukturierte Daten (JSON-LD) sind auf der Startseite vorhanden", async ({
  page,
}) => {
  await page.goto("/");
  const scripts = page.locator('script[type="application/ld+json"]');
  const count = await scripts.count();
  expect(count).toBeGreaterThanOrEqual(3);
  const contents = await scripts.allTextContents();
  const types = contents.map((c) => JSON.parse(c)["@type"]);
  expect(types).toContain("Organization");
  expect(types).toContain("Service");
  expect(types).toContain("FAQPage");
});
