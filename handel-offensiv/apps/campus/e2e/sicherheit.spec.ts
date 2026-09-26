import { expect, test } from "@playwright/test";

/**
 * Sicherheits-Header des Campus (next.config.ts + Middleware).
 * Der Campus ist nie oeffentlich indexierbar; die CSP wird mit Nonce
 * in der Middleware gesetzt.
 */

const PAGES = ["/login", "/datenschutz"] as const;

test.describe("Sicherheits-Header", () => {
  for (const path of PAGES) {
    test(`${path}: noindex und Basis-Header vorhanden`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(200);
      const headers = response.headers();

      expect(headers["x-robots-tag"] ?? "").toMatch(/noindex/i);
      expect(headers["x-content-type-options"] ?? "").toMatch(/nosniff/i);
      expect(headers["x-frame-options"] ?? "").toMatch(/deny/i);
      expect(headers["referrer-policy"] ?? "").toMatch(/strict-origin-when-cross-origin/i);
      expect(headers["x-powered-by"]).toBeUndefined();
    });
  }

  test("Content-Security-Policy mit Nonce (tolerant, solange die Middleware-CSP fehlt)", async ({ request }) => {
    const response = await request.get("/login", { maxRedirects: 0 });
    const csp = response.headers()["content-security-policy"];

    if (!csp) {
      // Uebergangsweise tolerant: Die CSP wird in src/middleware.ts gesetzt.
      test.info().annotations.push({
        type: "warning",
        description: "Content-Security-Policy-Header fehlt noch (Middleware-CSP mit Nonce ausstehend).",
      });
      return;
    }

    expect(csp).toContain("nonce-");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });

  test("Robots-Meta im HTML: noindex", async ({ page }) => {
    await page.goto("/login");
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveCount(1);
    await expect(robots).toHaveAttribute("content", /noindex/i);
  });
});

/**
 * Nonce-CSP + 'strict-dynamic': Nur Skripte mit Nonce duerfen laufen. Next
 * traegt den Nonce nur in dynamisch gerenderte Seiten ein – statisch
 * vorgerenderte Routen haetten Skripte ohne Nonce und wuerden komplett
 * blockiert (keine Hydration). Das Root-Layout erzwingt deshalb dynamisches
 * Rendering (force-dynamic). Diese Tests stellen sicher, dass das fuer die
 * Seiten gilt, die frueher statisch waren.
 */
const HYDRATION_PAGES = ["/login/passwort-vergessen", "/datenschutz", "/impressum"] as const;

test.describe("CSP: keine Verstoesse, Hydration funktioniert", () => {
  for (const path of HYDRATION_PAGES) {
    test(`${path}: alle Skripte tragen den Nonce, keine CSP-Verstoesse, React hydriert`, async ({ page }) => {
      const violations: string[] = [];
      await page.addInitScript(() => {
        document.addEventListener("securitypolicyviolation", (e) => {
          const ev = e as SecurityPolicyViolationEvent;
          (window as unknown as { __cspViolations: string[] }).__cspViolations ??= [];
          (window as unknown as { __cspViolations: string[] }).__cspViolations.push(
            `${ev.violatedDirective} ${ev.blockedURI}`,
          );
        });
      });
      page.on("console", (msg) => {
        if (/content security policy/i.test(msg.text())) violations.push(msg.text());
      });

      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      const csp = response?.headers()["content-security-policy"] ?? "";
      const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
      expect(nonce, "CSP-Header mit Nonce").toBeTruthy();

      // Jedes ausfuehrbare Skript im HTML traegt den Nonce dieses Requests.
      const scriptsWithoutNonce = await page.evaluate(
        (n) =>
          Array.from(document.querySelectorAll("script"))
            .filter((s) => !s.type || s.type === "module" || s.type === "text/javascript")
            .filter((s) => s.nonce !== n)
            .map((s) => s.src || s.textContent?.slice(0, 40) || "(inline)"),
        nonce,
      );
      expect(scriptsWithoutNonce).toEqual([]);

      // React hydriert (Next haengt dazu die Fiber-Referenzen an den DOM).
      await page.waitForFunction(
        () =>
          Object.keys(document.body).some((k) => k.startsWith("__reactFiber") || k.startsWith("__reactContainer")) ||
          Object.keys(document).some((k) => k.startsWith("__reactContainer")),
        undefined,
        { timeout: 15_000 },
      );

      const pageViolations = await page.evaluate(
        () => (window as unknown as { __cspViolations?: string[] }).__cspViolations ?? [],
      );
      expect(pageViolations).toEqual([]);
      expect(violations).toEqual([]);
    });
  }
});
