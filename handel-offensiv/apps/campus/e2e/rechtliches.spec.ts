import { expect, test } from "@playwright/test";

/**
 * Rechtsseiten sind ohne Sitzung erreichbar (PUBLIC_PATHS in src/middleware.ts).
 * Inhaltlich sind es Entwuerfe – geprueft wird nur Erreichbarkeit,
 * Rahmen und die Entwurfskennzeichnung.
 */

test.describe("Rechtliches", () => {
  test("/datenschutz wird ohne Sitzung angezeigt", async ({ page }) => {
    const response = await page.goto("/datenschutz");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/datenschutz$/);

    await expect(page.getByRole("heading", { level: 1, name: "Datenschutzerklärung" })).toBeVisible();
    await expect(page.getByText(/entwurf/i).first()).toBeVisible();
    await expect(page.getByRole("navigation", { name: /rechtliches/i })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
  });

  test("/impressum wird ohne Sitzung angezeigt", async ({ page }) => {
    const response = await page.goto("/impressum");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/impressum$/);

    await expect(page.getByRole("heading", { level: 1, name: "Impressum" })).toBeVisible();
    await expect(page.getByText(/entwurf/i).first()).toBeVisible();
    await expect(page.getByRole("navigation", { name: /rechtliches/i })).toBeVisible();
  });

  test("Rechtsseiten sind mobil ohne horizontales Scrollen nutzbar", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/impressum");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  });
});
