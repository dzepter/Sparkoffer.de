"use server";

import { headers } from "next/headers";
import {
  readFormValues,
  requestOptions,
  validateContact,
  type ContactFormState,
} from "@/lib/contact";
import { sendContactMail } from "@/lib/mail";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * Server Action für das Kontaktformular.
 * Serverseitige Validierung, Honeypot, Rate-Limiting, Mailversand.
 * Es werden keine Anfrageinhalte geloggt.
 */
export async function submitContact(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const values = readFormValues(formData);
  const { datenschutz, ...plainValues } = values;

  // Honeypot: Feld ist für Menschen unsichtbar – Inhalt deutet auf Bots hin.
  // Bots erhalten eine unauffällige Erfolgsmeldung.
  if (String(formData.get("firmenwebseite") ?? "") !== "") {
    return { status: "success" };
  }

  /*
   * Rate-Limiting: Der letzte X-Forwarded-For-Eintrag stammt vom
   * nächstgelegenen (vertrauenswürdigen) Proxy und ist – anders als der
   * erste – nicht frei vom Client wählbar. Zusätzlich begrenzt ein
   * globales Limit die Gesamtzahl der Anfragen, falls Absenderkennungen
   * rotiert werden.
   */
  const h = await headers();
  const forwarded = (h.get("x-forwarded-for") ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const ip = forwarded[forwarded.length - 1] || "unbekannt";
  if (isRateLimited(`kontakt:${ip}`) || isRateLimited("kontakt:gesamt", 60)) {
    return {
      status: "error",
      fieldErrors: {},
      formError:
        "Es sind gerade sehr viele Anfragen eingegangen. Bitte versuchen Sie es in einigen Minuten erneut oder rufen Sie uns an.",
      values: plainValues,
    };
  }

  const fieldErrors = validateContact({ ...plainValues, datenschutz });
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors, values: plainValues };
  }

  const angebotLabel =
    requestOptions.find((option) => option.value === values.angebot)?.label ??
    values.angebot;

  // Anfragekontext aus der Verlinkung (z. B. konkreter Offensivtag)
  const kontext = String(formData.get("kontext") ?? "")
    .trim()
    .slice(0, 200);

  const lines = [
    "Neue Anfrage über das Kontaktformular auf aigner-offensiv.de",
    "",
    kontext ? `Bezug: ${kontext}` : null,
    `Name: ${values.vorname} ${values.nachname}`,
    `Unternehmen: ${values.unternehmen}`,
    `Funktion: ${values.funktion}`,
    `E-Mail: ${values.email}`,
    values.telefon ? `Telefon: ${values.telefon}` : null,
    values.standorte ? `Anzahl Standorte: ${values.standorte}` : null,
    values.teilnehmer ? `Mögliche Teilnehmer: ${values.teilnehmer}` : null,
    `Gewünschtes Angebot: ${angebotLabel}`,
    values.veranstaltungsort
      ? `Bevorzugter Veranstaltungsort: ${values.veranstaltungsort}`
      : null,
    "",
    "Nachricht:",
    values.nachricht,
    "",
    "Die Datenschutzerklärung wurde bestätigt.",
  ].filter((line): line is string => line !== null);

  const result = await sendContactMail({
    subject: `Anfrage: ${angebotLabel} – ${values.unternehmen}`,
    text: lines.join("\n"),
    replyTo: values.email,
  });

  if (!result.ok) {
    return {
      status: "error",
      fieldErrors: {},
      formError:
        "Ihre Anfrage konnte gerade nicht übermittelt werden. Bitte versuchen Sie es später erneut – oder erreichen Sie uns direkt per E-Mail oder Telefon.",
      values: plainValues,
    };
  }

  return { status: "success" };
}
