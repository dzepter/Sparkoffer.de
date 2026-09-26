/**
 * Tests fuer den plattformneutralen E-Mail-Kern der Edge Functions
 * (Vorlagen + Resend-Abbildung). Laufen ohne Deno und ohne Netz.
 */
import { describe, expect, it } from "vitest";

import {
  DEFAULT_FROM,
  buildResendRequest,
  deletionConfirmedEmail,
  escapeHtml,
  invitationEmail,
  parseSender,
  reminderEmail,
} from "../../functions/_shared/email-core.ts";

describe("Absender", () => {
  it("Standard-Absender ist die Akademie auf der Versand-Subdomain mail.handel-offensiv.de", () => {
    expect(DEFAULT_FROM).toBe("Handel Offensiv Akademie <akademie@mail.handel-offensiv.de>");
    expect(parseSender(DEFAULT_FROM)).toEqual({
      address: "akademie@mail.handel-offensiv.de",
      domain: "mail.handel-offensiv.de",
    });
  });

  it("akzeptiert nackte Adressen und lehnt Unsinn ab", () => {
    expect(parseSender("info@aigner-offensiv.de").domain).toBe("aigner-offensiv.de");
    expect(() => parseSender("kein-absender")).toThrow();
    expect(() => parseSender("Name <ohne-at>")).toThrow();
  });
});

describe("Resend-Request", () => {
  const message = { to: "person@test.invalid", subject: "Betreff", html: "<p>Hallo</p>", text: "Hallo" };

  it("baut den Request mit Bearer-Key, Reply-To, Idempotenz und Auto-Submitted", () => {
    const req = buildResendRequest(
      message,
      { from: DEFAULT_FROM, replyTo: "info@aigner-offensiv.de" },
      "re_test_key",
      { idempotencyKey: "invitation:123", tag: "einladung" },
    );
    expect(req.url).toBe("https://api.resend.com/emails");
    expect(req.method).toBe("POST");
    expect(req.headers.Authorization).toBe("Bearer re_test_key");
    expect(req.headers["Idempotency-Key"]).toBe("invitation:123");
    expect(req.body).toEqual({
      from: DEFAULT_FROM,
      to: ["person@test.invalid"],
      subject: "Betreff",
      html: "<p>Hallo</p>",
      text: "Hallo",
      reply_to: "info@aigner-offensiv.de",
      headers: { "Auto-Submitted": "auto-generated" },
      tags: [{ name: "kategorie", value: "einladung" }],
    });
  });

  it("laesst reply_to und tags weg, wenn nicht gesetzt", () => {
    const req = buildResendRequest(message, { from: DEFAULT_FROM }, "k");
    expect(req.body).not.toHaveProperty("reply_to");
    expect(req.body).not.toHaveProperty("tags");
    expect(req.headers).not.toHaveProperty("Idempotency-Key");
  });

  it("scheitert frueh bei ungueltigem Absender", () => {
    expect(() => buildResendRequest(message, { from: "kaputt" }, "k")).toThrow(/Absender/);
  });
});

describe("Vorlagen", () => {
  it("Einladung enthaelt Organisation, Link, Ablauf und ist HTML-sicher", () => {
    const mail = invitationEmail({
      organizationName: 'Muster <Handels> & "Gruppe"',
      inviteUrl: "https://www.handel-offensiv.de/akademie/einladung?token=abc",
      expiresAtLabel: "12. März 2027",
    });
    expect(mail.subject).toBe("Ihre Einladung zu Handel Offensiv");
    expect(mail.html).toContain("Muster &lt;Handels&gt; &amp; &quot;Gruppe&quot;");
    expect(mail.html).not.toContain("<Handels>");
    expect(mail.html).toContain("https://www.handel-offensiv.de/akademie/einladung?token=abc");
    expect(mail.html).toContain("12. März 2027");
    expect(mail.text).toContain("https://www.handel-offensiv.de/akademie/einladung?token=abc");
    // Palette v2: Navy statt Gruen
    expect(mail.html).toContain("#0F2340");
    expect(mail.html).not.toContain("#A8C62B");
  });

  it("Erinnerung und Loeschbestaetigung liefern Betreff, HTML und Text", () => {
    const r = reminderEmail({ headline: "Neuer Impuls", message: "Modul 02 ist frei.", appUrl: "https://www.handel-offensiv.de/akademie" });
    expect(r.subject).toBe("Neuer Impuls");
    expect(r.html).toContain("Modul 02 ist frei.");
    const d = deletionConfirmedEmail();
    expect(d.subject).toBe("Ihr Konto wurde gelöscht");
    expect(d.text).toContain("gelöscht");
  });

  it("escapeHtml maskiert alle relevanten Zeichen", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});
