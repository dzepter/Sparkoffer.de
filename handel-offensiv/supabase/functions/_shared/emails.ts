/**
 * E-Mail-Versand fuer Edge Functions (Deno) – Provider-Adapter.
 *
 * Vorlagen und Resend-Abbildung liegen plattformneutral in email-core.ts
 * (dort auch getestet). Diese Datei kapselt NUR Laufzeit: Env, fetch, Logging.
 *
 * Provider-Auswahl (EMAIL_PROVIDER, Default automatisch):
 *   resend  -> RESEND_API_KEY gesetzt (Standard fuer Staging/Produktion, K-4)
 *   http    -> EMAIL_PROVIDER_URL gesetzt (generischer JSON-Relay, Altpfad)
 *   none    -> kein Versand; Aufrufer bieten den Link zum manuellen Versand an
 *
 * Absender (K-4): EMAIL_FROM, Default "Aigner Offensiv Campus <campus@mail.aigner-offensiv.de>".
 * Reply-To (optional): EMAIL_REPLY_TO, z. B. das bestehende Microsoft-365-Postfach.
 * Die Absender-Domain MUSS die bei Resend verifizierte Versand-Subdomain sein –
 * sonst wird der Versand hier abgelehnt (Schutz vor DMARC-p=reject-Abweisungen).
 */

import {
  DEFAULT_FROM,
  buildResendRequest,
  parseSender,
  type EmailMessage,
  type SenderConfig,
} from "./email-core.ts";

export {
  deletionConfirmedEmail,
  invitationEmail,
  reminderEmail,
  type EmailMessage,
} from "./email-core.ts";

export interface SendEmailResult {
  sent: boolean;
  /** Provider-ID der Nachricht (Resend), falls vorhanden */
  providerId?: string;
  /** Deutschsprachiger Grund, falls nicht versendet wurde. */
  reason?: string;
}

export interface EmailProvider {
  readonly name: "resend" | "http" | "none";
  send(message: EmailMessage, opts?: SendOptions): Promise<SendEmailResult>;
}

export interface SendOptions {
  /** Stabiler Schluessel je fachlichem Vorgang (z. B. invitation:<id>) */
  idempotencyKey?: string;
  /** Kategorie fuer Provider-Statistiken, z. B. "einladung" */
  tag?: string;
}

const MANUAL_HINT = "Bitte versenden Sie den Link manuell.";

function senderConfig(): SenderConfig {
  const from = Deno.env.get("EMAIL_FROM") ?? DEFAULT_FROM;
  const replyTo = Deno.env.get("EMAIL_REPLY_TO") || undefined;
  return replyTo ? { from, replyTo } : { from };
}

/**
 * Erlaubte Absender-Domain (Default: mail.aigner-offensiv.de). Ein Absender
 * ausserhalb dieser Domain wuerde unter DMARC p=reject abgewiesen – daher
 * fail-closed hier statt Bounce beim Empfaenger.
 */
function allowedSenderDomain(): string {
  return (Deno.env.get("EMAIL_SENDER_DOMAIN") ?? "mail.aigner-offensiv.de").toLowerCase();
}

// --------------------------------------------------------------------------
// Provider
// --------------------------------------------------------------------------

function resendProvider(apiKey: string): EmailProvider {
  return {
    name: "resend",
    async send(message, opts = {}) {
      const sender = senderConfig();
      const { domain } = parseSender(sender.from);
      if (domain !== allowedSenderDomain()) {
        console.error(`E-Mail-Absender ${sender.from} liegt nicht in ${allowedSenderDomain()} – Versand verweigert.`);
        return { sent: false, reason: `Der E-Mail-Absender ist nicht korrekt konfiguriert. ${MANUAL_HINT}` };
      }
      const req = buildResendRequest(message, sender, apiKey, opts);
      try {
        const res = await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: JSON.stringify(req.body),
        });
        if (!res.ok) {
          console.error("Resend antwortete mit Status", res.status, await res.text());
          return { sent: false, reason: `Die E-Mail konnte nicht versendet werden. ${MANUAL_HINT}` };
        }
        const data = (await res.json().catch(() => ({}))) as { id?: string };
        return { sent: true, ...(data.id ? { providerId: data.id } : {}) };
      } catch (err) {
        console.error("Resend-Versand fehlgeschlagen:", err);
        return { sent: false, reason: `Die E-Mail konnte nicht versendet werden. ${MANUAL_HINT}` };
      }
    },
  };
}

function httpRelayProvider(url: string, token: string | undefined): EmailProvider {
  return {
    name: "http",
    async send(message) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({ from: senderConfig().from, ...message }),
        });
        if (!res.ok) {
          console.error("E-Mail-Relay antwortete mit Status", res.status, await res.text());
          return { sent: false, reason: `Die E-Mail konnte nicht versendet werden. ${MANUAL_HINT}` };
        }
        return { sent: true };
      } catch (err) {
        console.error("E-Mail-Relay fehlgeschlagen:", err);
        return { sent: false, reason: `Die E-Mail konnte nicht versendet werden. ${MANUAL_HINT}` };
      }
    },
  };
}

const noneProvider: EmailProvider = {
  name: "none",
  send() {
    return Promise.resolve({
      sent: false,
      reason: `Es ist kein E-Mail-Versand konfiguriert (RESEND_API_KEY fehlt). ${MANUAL_HINT}`,
    });
  },
};

/** Waehlt den Provider anhand der Umgebung. */
export function emailProvider(): EmailProvider {
  const forced = Deno.env.get("EMAIL_PROVIDER");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const relayUrl = Deno.env.get("EMAIL_PROVIDER_URL");

  if (forced === "none") return noneProvider;
  if (forced === "resend" || (!forced && resendKey)) {
    return resendKey ? resendProvider(resendKey) : noneProvider;
  }
  if (forced === "http" || (!forced && relayUrl)) {
    return relayUrl ? httpRelayProvider(relayUrl, Deno.env.get("EMAIL_PROVIDER_TOKEN")) : noneProvider;
  }
  return noneProvider;
}

/**
 * Versendet ueber den konfigurierten Provider. Liefert NIE eine Exception:
 * Aufrufer pruefen `sent` und bieten ggf. einen manuellen Weg an.
 */
export function sendEmail(message: EmailMessage, opts?: SendOptions): Promise<SendEmailResult> {
  return emailProvider().send(message, opts);
}
