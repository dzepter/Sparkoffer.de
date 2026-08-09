/**
 * E-Mail-Textvorlagen (deutsch, Sie-Form, Aigner-Ton: klar, sportlich, ruhig)
 * und generischer Versand ueber einen konfigurierbaren HTTP-Provider.
 *
 * Gestaltung: schlichtes HTML ohne Marketing-Optik – Papierton, klare
 * Typografie, ein gruener Akzent (Design Tokens aus @handel-offensiv/config:
 * green #A8C62B, paper #F7F6F1, dark #12160E). Archivo steht in E-Mail-Clients
 * i. d. R. nicht zur Verfuegung, daher neutrale System-Fallbacks.
 *
 * Versand-Env (alle optional – ohne EMAIL_PROVIDER_URL wird nicht versendet):
 *   EMAIL_PROVIDER_URL    HTTP-Endpoint, der {from,to,subject,html,text} als
 *                         JSON-POST entgegennimmt (z. B. kleiner Relay vor
 *                         Resend/Postmark/SMTP).
 *   EMAIL_PROVIDER_TOKEN  optionales Bearer-Token fuer den Endpoint.
 *   EMAIL_FROM            Absenderadresse, Default: Aigner-Support.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  sent: boolean;
  /** Deutschsprachiger Grund, falls nicht versendet wurde. */
  reason?: string;
}

const COMPANY = "Aigner Offensiv";
const SUPPORT_EMAIL = "info@aigner-offensiv.de";

// --------------------------------------------------------------------------
// Layout
// --------------------------------------------------------------------------

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="de">
  <body style="margin:0;padding:0;background-color:#F7F6F1;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;font-family:Arial,Helvetica,sans-serif;color:#12160E;">
      <p style="margin:0 0 24px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#12160E;">
        ${COMPANY} <span style="color:#A8C62B;">&#9644;</span>
      </p>
      <div style="background:#FFFFFF;border:1px solid #E3E1D8;border-radius:2px;padding:28px 24px;">
        <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#12160E;">${title}</h1>
        ${bodyHtml}
      </div>
      <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#6B6A62;">
        Diese Nachricht wurde automatisch versendet. Bei Fragen erreichen Sie uns unter
        <a href="mailto:${SUPPORT_EMAIL}" style="color:#12160E;">${SUPPORT_EMAIL}</a>.<br />
        ${COMPANY} &middot; Handel ist Mannschaftssport. F&uuml;hrung entscheidet das Spiel.
      </p>
    </div>
  </body>
</html>`;
}

const P_STYLE = 'style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#12160E;"';

function button(url: string, label: string): string {
  return `<p style="margin:22px 0;">
    <a href="${url}"
       style="display:inline-block;background:#12160E;color:#FFFFFF;text-decoration:none;
              font-size:15px;padding:13px 24px;border-radius:2px;">${label}</a>
  </p>
  <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:#6B6A62;">
    Falls der Button nicht funktioniert, kopieren Sie bitte diesen Link in Ihren Browser:<br />
    <span style="word-break:break-all;">${url}</span>
  </p>`;
}

// --------------------------------------------------------------------------
// Vorlagen
// --------------------------------------------------------------------------

/** Einladung in den digitalen Mannschaftsraum. */
export function invitationEmail(params: {
  organizationName: string;
  inviteUrl: string;
  /** z. B. "23. August 2026" */
  expiresAtLabel: string;
}): Omit<EmailMessage, "to"> {
  const subject = "Ihre Einladung zu Handel Offensiv";
  const html = layout(
    "Willkommen im Team.",
    `<p ${P_STYLE}>Guten Tag,</p>
     <p ${P_STYLE}>
       Sie wurden f&uuml;r <strong>${params.organizationName}</strong> zum Programm
       <strong>Handel Offensiv</strong> eingeladen &ndash; Ihrem digitalen Mannschaftsraum
       zum Pr&auml;senzprogramm von ${COMPANY}.
     </p>
     <p ${P_STYLE}>
       Legen Sie jetzt Ihr pers&ouml;nliches Konto an und machen Sie sich startklar.
     </p>
     ${button(params.inviteUrl, "Einladung annehmen")}
     <p ${P_STYLE}>
       Diese Einladung ist bis zum <strong>${params.expiresAtLabel}</strong> g&uuml;ltig.
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
  const subject = params.headline;
  const html = layout(
    params.headline,
    `<p ${P_STYLE}>Guten Tag,</p>
     <p ${P_STYLE}>${params.message}</p>
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

// --------------------------------------------------------------------------
// Versand
// --------------------------------------------------------------------------

/**
 * Versendet ueber den konfigurierten HTTP-Provider.
 * Ist EMAIL_PROVIDER_URL nicht gesetzt, wird NICHT versendet – der Aufrufer
 * muss das Ergebnis pruefen und ggf. einen manuellen Weg anbieten
 * (z. B. inviteUrl in der Antwort zurueckgeben).
 */
export async function sendEmail(message: EmailMessage): Promise<SendEmailResult> {
  const providerUrl = Deno.env.get("EMAIL_PROVIDER_URL");
  if (!providerUrl) {
    return {
      sent: false,
      reason:
        "Es ist kein E-Mail-Versand konfiguriert (EMAIL_PROVIDER_URL fehlt). " +
        "Bitte versenden Sie den Link manuell.",
    };
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = Deno.env.get("EMAIL_PROVIDER_TOKEN");
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(providerUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") ?? `Handel Offensiv <${SUPPORT_EMAIL}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    if (!res.ok) {
      console.error("E-Mail-Provider antwortete mit Status", res.status, await res.text());
      return {
        sent: false,
        reason: "Die E-Mail konnte nicht versendet werden. Bitte versenden Sie den Link manuell.",
      };
    }
    return { sent: true };
  } catch (err) {
    console.error("E-Mail-Versand fehlgeschlagen:", err);
    return {
      sent: false,
      reason: "Die E-Mail konnte nicht versendet werden. Bitte versenden Sie den Link manuell.",
    };
  }
}
