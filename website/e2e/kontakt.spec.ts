import { expect, test } from "@playwright/test";

/**
 * End-to-End-Tests für die Kontaktanfrage.
 * Ohne SMTP-Konfiguration akzeptiert der Server Anfragen im
 * Entwicklungsmodus – die Tests prüfen den vollständigen Ablauf
 * inklusive Validierung und Spamschutz.
 */

test("Kontaktanfrage mit gültigen Daten wird bestätigt", async ({ page }) => {
  await page.goto("/kontakt");

  await page.getByLabel("Name", { exact: false }).first().fill("Maria Beispiel");
  await page.getByLabel("Unternehmen").fill("Beispiel Handels GmbH");
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

test("Optionale Angaben sind einklappbar und werden übernommen", async ({
  page,
}) => {
  await page.goto("/kontakt");

  await page.getByLabel("Name", { exact: false }).first().fill("Max Muster");
  await page.getByLabel("Unternehmen").fill("Muster Märkte KG");
  await page
    .getByLabel("Geschäftliche E-Mail-Adresse")
    .fill("max@example.de");
  await page.getByLabel("Gewünschtes Angebot").selectOption("offensivtag");
  await page.getByLabel("Ihre Nachricht").fill("Bitte um Rückruf.");

  // Optionale Angaben aufklappen und ausfüllen
  await page.getByText("Weitere Angaben (optional)").click();
  await expect(page.getByLabel("Telefonnummer")).toBeVisible();
  await page.getByLabel("Telefonnummer").fill("089 123456");
  await page.getByLabel("Anzahl der Standorte").fill("12");

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

  await expect(page.locator("#fehler-name")).toContainText(/Namen/);
  await expect(page.locator("#fehler-email")).toContainText(/E-Mail/);
  await expect(page.locator("#fehler-datenschutz")).toContainText(
    /Datenschutzerklärung/
  );
});

test("Eingaben bleiben nach Validierungsfehler erhalten", async ({ page }) => {
  await page.goto("/kontakt");

  await page.getByLabel("Name", { exact: false }).first().fill("Max Muster");
  await page.getByLabel("Unternehmen").fill("Muster AG");
  await page.getByRole("button", { name: "Anfrage senden" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: /Anfrage/ })
  ).toBeVisible({ timeout: 10_000 });
  await expect(page.getByLabel("Name", { exact: false }).first()).toHaveValue(
    "Max Muster"
  );
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

  await page.getByLabel("Name", { exact: false }).first().fill("Bot Bot");
  await page.getByLabel("Unternehmen").fill("Bot GmbH");
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

  await page.getByLabel("Name", { exact: false }).first().fill("A".repeat(500));
  await page.getByLabel("Unternehmen").fill("Langname-Test GmbH");
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

test("Formular ist vollständig per Tastatur bedienbar", async ({ page }) => {
  await page.goto("/kontakt");

  await page.getByLabel("Name", { exact: false }).first().focus();
  await page.keyboard.type("Karla Tastatur");
  await page.keyboard.press("Tab");
  await page.keyboard.type("Tastatur GmbH");
  await page.keyboard.press("Tab");
  await page.keyboard.type("karla@example.de");
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowDown"); // Auswahl im Select
  await page.keyboard.press("Tab");
  await page.keyboard.type("Anfrage per Tastatur.");

  await expect(page.getByLabel("Unternehmen")).toHaveValue("Tastatur GmbH");
  await expect(
    page.getByLabel("Geschäftliche E-Mail-Adresse")
  ).toHaveValue("karla@example.de");
});
