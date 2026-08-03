import nodemailer from "nodemailer";

/**
 * E-Mail-Versand für Kontaktanfragen.
 *
 * Konfiguration ausschließlich über Umgebungsvariablen (siehe .env.example):
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS,
 *   CONTACT_TO, CONTACT_FROM
 *
 * Ohne SMTP-Konfiguration:
 *   – in der Entwicklung wird die Anfrage als zugestellt behandelt
 *     (Hinweis im Server-Log, ohne personenbezogene Daten),
 *   – in Produktion wird ein Fehler zurückgegeben, damit keine
 *     Anfragen unbemerkt verloren gehen.
 */

export type ContactMail = {
  subject: string;
  text: string;
  replyTo?: string;
};

function isConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

export async function sendContactMail(
  mail: ContactMail
): Promise<{ ok: true } | { ok: false; reason: "not-configured" | "send-failed" }> {
  if (!isConfigured()) {
    // CONTACT_DEV_ACCEPT=true erlaubt Tests gegen den Produktions-Build
    // ohne SMTP – niemals im Livebetrieb setzen.
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.CONTACT_DEV_ACCEPT === "true"
    ) {
      console.info(
        "[kontakt] SMTP nicht konfiguriert – Anfrage im Entwicklungsmodus akzeptiert (Inhalt wird nicht geloggt)."
      );
      return { ok: true };
    }
    console.error(
      "[kontakt] SMTP ist nicht konfiguriert – Anfrage konnte nicht zugestellt werden."
    );
    return { ok: false, reason: "not-configured" };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  try {
    await transporter.sendMail({
      from:
        process.env.CONTACT_FROM ??
        process.env.SMTP_USER ??
        "website@aigner-offensiv.de",
      to: process.env.CONTACT_TO ?? "info@aigner-offensiv.de",
      subject: mail.subject,
      text: mail.text,
      replyTo: mail.replyTo,
    });
    return { ok: true };
  } catch {
    // Bewusst ohne Fehlerdetails, damit keine Anfrageinhalte in Logs landen.
    console.error("[kontakt] E-Mail-Versand fehlgeschlagen.");
    return { ok: false, reason: "send-failed" };
  }
}
