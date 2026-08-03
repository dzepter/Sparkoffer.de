import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * axe-Basisprüfung (WCAG 2.0/2.1 A + AA) über alle Seiten.
 * Schlägt bei Verstößen der Stufen "serious" und "critical" fehl.
 */

const pages = [
  "/",
  "/handel-offensiv",
  "/offensivtage",
  "/fuer-unternehmen",
  "/rainer-aigner",
  "/impulse",
  "/kontakt",
  "/impressum",
  "/datenschutz",
];

for (const path of pages) {
  test(`axe-Prüfung: ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // Dekorative Wasserzeichen-Nummern: bewusst kontrastarm, Information
      // steht unmittelbar daneben in voller Lesbarkeit (aria-hidden).
      .exclude("[data-watermark]")
      .analyze();

    const relevant = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(
      relevant.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
      }))
    ).toEqual([]);
  });
}
