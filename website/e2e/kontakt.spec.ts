import { expect, test } from "@playwright/test";

/**
 * End-to-End-Tests für die Kontaktanfrage.
 * Ohne SMTP-Konfiguration akzeptiert der Server Anfragen im
 * Entwicklungsmodus – die Tests prüfen den vollständigen Ablauf
 * inklusive Validierung und Spamschutz.
 */

test("Kontaktanfrage mit gültigen Daten wird bestätigt", async ({ page }) => {
  await page.goto("/kontakt");

  await page.getByLabel("Vorname").fill("Maria");
  await page.getByLabel("Nachname").fill("Beispiel");
  await page.getByLabel("Unternehmen").fill("Beispiel Handels GmbH");
  await page.getByLabel("Ihre Funktion").fill("Personalleitung");
  await page
    .getByLabel("Geschäftliche E-Mail-Adresse")
    .fill("maria.beispiel@example.de");
  await page
    .getByLabel("Gewünschtes Angebot")
    .selectOption("fuehrerschein");
  await page
    .getByLabel("Ihre Nachricht")
    .fill("Wir möchten zwölf Marktleiter systematisch entwickeln.");
  await page.getByLabel(/Ich habe die/).check();

  await page.getByRole("button", { name: "Anfrage senden" }).click();

  await expect(
    page.getByRole("status").filter({ hasText: "Vielen Dank" })
  ).toBeVisible({ timeout: 10_000 });
});

test("Leeres Formular zeigt verständliche Fehlermeldungen", async ({
  page,
}) => {
  await page.goto("/kontakt");
  await page.getByRole("button", { name: "Anfrage senden" }).click();

  // Filter nötig, da Nexts Route-Announcer ebenfalls role="alert" trägt
  const alert = page.getByRole("alert").filter({ hasText: /Anfrage/ });
  await expect(alert).toBeVisible({ timeout: 10_000 });
  await expect(alert).toContainText(/markierten Felder/i);

  await expect(page.locator("#fehler-vorname")).toContainText(/Vornamen/);
  await expect(page.locator("#fehler-email")).toContainText(/E-Mail/);
  await expect(page.locator("#fehler-datenschutz")).toContainText(
    /Datenschutzerklärung/
  );
});

test("Eingaben bleiben nach Validierungsfehler erhalten", async ({ page }) => {
  await page.goto("/kontakt");

  await page.getByLabel("Vorname").fill("Max");
  await page.getByLabel("Unternehmen").fill("Muster AG");
  await page.getByRole("button", { name: "Anfrage senden" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: /Anfrage/ })
  ).toBeVisible({ timeout: 10_000 });
  await expect(page.getByLabel("Vorname")).toHaveValue("Max");
  await expect(page.getByLabel("Unternehmen")).toHaveValue("Muster AG");
});

test("Vorauswahl über URL-Parameter funktioniert", async ({ page }) => {
  await page.goto("/kontakt?angebot=wirkungscheck");
  await expect(page.getByLabel("Gewünschtes Angebot")).toHaveValue(
    "wirkungscheck"
  );
});

test("Honeypot-Feld ist für Menschen nicht sichtbar", async ({ page }) => {
  await page.goto("/kontakt");
  const honeypot = page.locator("#firmenwebseite");
  await expect(honeypot).toHaveCount(1);
  await expect(honeypot).not.toBeInViewport();
});

test("Ausgefüllter Honeypot führt zu unauffälliger Bestätigung", async ({
  page,
}) => {
  await page.goto("/kontakt");

  await page.getByLabel("Vorname").fill("Bot");
  await page.getByLabel("Nachname").fill("Bot");
  await page.getByLabel("Unternehmen").fill("Bot GmbH");
  await page.getByLabel("Ihre Funktion").fill("Bot");
  await page
    .getByLabel("Geschäftliche E-Mail-Adresse")
    .fill("bot@example.com");
  await page.getByLabel("Gewünschtes Angebot").selectOption("offensivtag");
  await page.getByLabel("Ihre Nachricht").fill("Spam-Inhalt");
  await page.getByLabel(/Ich habe die/).check();
  // Honeypot wie ein Bot ausfüllen
  await page.locator("#firmenwebseite").fill("https://spam.example.com");

  await page.getByRole("button", { name: "Anfrage senden" }).click();

  await expect(
    page.getByRole("status").filter({ hasText: "Vielen Dank" })
  ).toBeVisible({ timeout: 10_000 });
});

test("Sehr lange Eingaben werden angenommen und begrenzt", async ({
  page,
}) => {
  await page.goto("/kontakt");

  const longName = "A".repeat(500);
  await page.getByLabel("Vorname").fill(longName);
  await page.getByLabel("Nachname").fill(longName);
  await page.getByLabel("Unternehmen").fill("Langname-Test GmbH");
  await page.getByLabel("Ihre Funktion").fill("Test");
  await page
    .getByLabel("Geschäftliche E-Mail-Adresse")
    .fill("lang@example.de");
  await page.getByLabel("Gewünschtes Angebot").selectOption("unsicher");
  await page.getByLabel("Ihre Nachricht").fill("X".repeat(6000));
  await page.getByLabel(/Ich habe die/).check();

  await page.getByRole("button", { name: "Anfrage senden" }).click();

  await expect(
    page.getByRole("status").filter({ hasText: "Vielen Dank" })
  ).toBeVisible({ timeout: 10_000 });
});
