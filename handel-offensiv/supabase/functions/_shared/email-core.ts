/**
 * E-Mail-Kern OHNE Laufzeitabhaengigkeiten (kein Deno.env, kein fetch):
 * Vorlagen, Absenderregeln und die Abbildung auf die Resend-API.
 * Wird von emails.ts (Deno) genutzt UND von den Node-Tests
 * (supabase/tests) importiert – deshalb hier keine Plattform-APIs.
 *
 * Gestaltung (K-7): tiefes Navy als Hauptfarbe, Off-White, ein sehr
 * sparsamer Gold-/Ocker-Akzent. Systemschriften (Archivo steht in
 * E-Mail-Clients nicht zur Verfuegung).
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SenderConfig {
  /** Anzeigename + Adresse, z. B. "Aigner Offensiv Campus <campus@mail.aigner-offensiv.de>" */
  from: string;
  /** Optional: Antworten landen im bestehenden Microsoft-365-Postfach */
  replyTo?: string;
}

/** Verbindlicher Standard-Absender (Freigabe K-4, 26.09.2026). */
export const DEFAULT_FROM = "Aigner Offensiv Campus <campus@mail.aigner-offensiv.de>";

export const COMPANY = "Aigner Offensiv";
export const SUPPORT_EMAIL = "info@aigner-offensiv.de";

/** Design-Tokens fuer E-Mails (Spiegel von packages/config tokens.ts, Palette v2). */
export const EMAIL_COLORS = {
  navy: "#0F2340",
  navyDeep: "#0A182E",
  offWhite: "#F6F4EE",
  white: "#FFFFFF",
  ink: "#141B26",
  inkSoft: "#4F5866",
  line: "#E2DFD6",
  gold: "#B8892B",
} as const;

// --------------------------------------------------------------------------
// Absender-Validierung
// --------------------------------------------------------------------------

const FROM_PATTERN = /^(?:[^<>]+\s)?<?([A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,}))>?$/;

/**
 * Prueft einen Absender ("Name <adresse>" oder "adresse") und liefert die
 * Domain. Wirft bei ungueltigem Format.
 */
export function parseSender(from: string): { address: string; domain: string } {
  const m = FROM_PATTERN.exec(from.trim());
  if (!m || !m[1] || !m[2]) throw new Error(`Ungueltiger Absender: ${from}`);
  return { address: m[1].toLowerCase(), domain: m[2].toLowerCase() };
}

// --------------------------------------------------------------------------
// Resend-API (https://api.resend.com/emails)
// --------------------------------------------------------------------------

export interface ResendRequest {
  url: string;
  method: "POST";
  headers: Record<string, string>;
  body: {
    from: string;
    to: string[];
    subject: string;
    html: string;
    text: string;
    reply_to?: string;
    headers?: Record<string, string>;
    tags?: Array<{ name: string; value: string }>;
  };
}

export const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Baut den Resend-Request. Idempotenz-Schluessel verhindert Doppelversand
 * bei Wiederholungen (Resend dedupliziert 24 h).
 */
export function buildResendRequest(
  message: EmailMessage,
  sender: SenderConfig,
  apiKey: string,
  opts: { idempotencyKey?: string; tag?: string } = {},
): ResendRequest {
  parseSender(sender.from); // frueh scheitern statt 422 vom Provider
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  return {
    url: RESEND_API_URL,
    method: "POST",
    headers,
    body: {
      from: sender.from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(sender.replyTo ? { reply_to: sender.replyTo } : {}),
      // Auto-Submitted verhindert Autoresponder-Schleifen (RFC 3834)
      headers: { "Auto-Submitted": "auto-generated" },
      ...(opts.tag ? { tags: [{ name: "kategorie", value: opts.tag }] } : {}),
    },
  };
}

// --------------------------------------------------------------------------
// Layout
// --------------------------------------------------------------------------

function layout(title: string, bodyHtml: string): string {
  const c = EMAIL_COLORS;
  return `<!doctype html>
<html lang="de">
  <body style="margin:0;padding:0;background-color:${c.offWhite};">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;font-family:Arial,Helvetica,sans-serif;color:${c.ink};">
      <p style="margin:0 0 24px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${c.navy};">
        ${COMPANY} <span style="color:${c.gold};">&#9644;</span>
      </p>
      <div style="background:${c.white};border:1px solid ${c.line};border-top:3px solid ${c.navy};border-radius:2px;padding:28px 24px;">
        <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${c.navy};">${title}</h1>
        ${bodyHtml}
      </div>
      <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:${c.inkSoft};">
        Diese Nachricht wurde automatisch versendet. Bei Fragen erreichen Sie uns unter
        <a href="mailto:${SUPPORT_EMAIL}" style="color:${c.navy};">${SUPPORT_EMAIL}</a>.<br />
        ${COMPANY} &middot; Handel ist Mannschaftssport. F&uuml;hrung entscheidet das Spiel.
      </p>
    </div>
  </body>
</html>`;
}

const P_STYLE = `style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${EMAIL_COLORS.ink};"`;

function button(url: string, label: string): string {
  return `<p style="margin:22px 0;">
    <a href="${url}"
       style="display:inline-block;background:${EMAIL_COLORS.navy};color:${EMAIL_COLORS.white};text-decoration:none;
              font-size:15px;font-weight:bold;padding:13px 24px;border-radius:2px;">${label}</a>
  </p>
  <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:${EMAIL_COLORS.inkSoft};">
    Falls der Button nicht funktioniert, kopieren Sie bitte diesen Link in Ihren Browser:<br />
    <span style="word-break:break-all;">${url}</span>
  </p>`;
}

/** Minimales HTML-Escaping fuer eingefuegte Nutzertexte (Organisationsnamen etc.). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// --------------------------------------------------------------------------
// Vorlagen
// --------------------------------------------------------------------------

/** Einladung in den Campus. */
export function invitationEmail(params: {
  organizationName: string;
  inviteUrl: string;
  /** z. B. "23. August 2027" */
  expiresAtLabel: string;
}): Omit<EmailMessage, "to"> {
  const org = escapeHtml(params.organizationName);
  const subject = "Ihre Einladung zu Handel Offensiv";
  const html = layout(
    "Willkommen im Team.",
    `<p ${P_STYLE}>Guten Tag,</p>
     <p ${P_STYLE}>
       Sie wurden f&uuml;r <strong>${org}</strong> zum Programm
       <strong>Handel Offensiv</strong> eingeladen &ndash; Ihrem digitalen Mannschaftsraum
       zum Pr&auml;senzprogramm von ${COMPANY}.
     </p>
     <p ${P_STYLE}>
       Legen Sie jetzt Ihr pers&ouml;nliches Konto an und machen Sie sich startklar.
     </p>
     ${button(params.inviteUrl, "Einladung annehmen")}
     <p ${P_STYLE}>
       Diese Einladung ist bis zum <strong>${escapeHtml(params.expiresAtLabel)}</strong> g&uuml;ltig.
       Danach kann Ihnen Ihre Ansprechperson eine neue Einladung senden.
     </p>
     <p ${P_STYLE}>Wir freuen uns auf Sie.<br />Ihr Team von ${COMPANY}</p>`,
  );
  const text = `Guten Tag,

Sie wurden für ${params.organizationName} zum Programm Handel Offensiv eingeladen –
Ihrem digitalen Mannschaftsraum zum Präsenzprogramm von ${COMPANY}.

Legen Sie jetzt Ihr persönliches Konto an:
${params.inviteUrl}

Diese Einladung ist bis zum ${params.expiresAtLabel} gültig.

Wir freuen uns auf Sie.
Ihr Team von ${COMPANY}
Bei Fragen: ${SUPPORT_EMAIL}`;
  return { subject, html, text };
}

/** Erinnerung an einen neuen Lernimpuls oder einen anstehenden Termin. */
export function reminderEmail(params: {
  headline: string;
  message: string;
  appUrl: string;
}): Omit<EmailMessage, "to"> {
  const headline = escapeHtml(params.headline);
  const message = escapeHtml(params.message);
  const subject = params.headline;
  const html = layout(
    headline,
    `<p ${P_STYLE}>Guten Tag,</p>
     <p ${P_STYLE}>${message}</p>
     ${button(params.appUrl, "Jetzt weitermachen")}
     <p ${P_STYLE}>Dranbleiben lohnt sich &ndash; Schritt f&uuml;r Schritt.<br />Ihr Team von ${COMPANY}</p>`,
  );
  const text = `Guten Tag,

${params.message}

Weiter geht es hier: ${params.appUrl}

Dranbleiben lohnt sich – Schritt für Schritt.
Ihr Team von ${COMPANY}`;
  return { subject, html, text };
}

/** Bestaetigung der Kontoloeschung (DSGVO Art. 17). */
export function deletionConfirmedEmail(): Omit<EmailMessage, "to"> {
  const subject = "Ihr Konto wurde gelöscht";
  const html = layout(
    "Ihr Konto wurde gelöscht.",
    `<p ${P_STYLE}>Guten Tag,</p>
     <p ${P_STYLE}>
       wie von Ihnen gew&uuml;nscht, haben wir Ihr Konto bei <strong>Handel Offensiv</strong>
       gel&ouml;scht. Ihre pers&ouml;nlichen Daten, Reflexionen und Abgaben wurden entfernt
       bzw. anonymisiert.
     </p>
     <p ${P_STYLE}>
       Sollten Sie das Programm sp&auml;ter wieder nutzen wollen, kann Ihre Ansprechperson
       Sie jederzeit neu einladen.
     </p>
     <p ${P_STYLE}>Alles Gute f&uuml;r Ihren weiteren Weg.<br />Ihr Team von ${COMPANY}</p>`,
  );
  const text = `Guten Tag,

wie von Ihnen gewünscht, haben wir Ihr Konto bei Handel Offensiv gelöscht.
Ihre persönlichen Daten, Reflexionen und Abgaben wurden entfernt bzw. anonymisiert.

Sollten Sie das Programm später wieder nutzen wollen, kann Ihre Ansprechperson
Sie jederzeit neu einladen.

Alles Gute für Ihren weiteren Weg.
Ihr Team von ${COMPANY}
Bei Fragen: ${SUPPORT_EMAIL}`;
  return { subject, html, text };
}
