/**
 * Kontaktanfrage: Typen, Auswahloptionen und serverseitige Validierung.
 * Bewusst ohne zusätzliche Abhängigkeiten umgesetzt.
 *
 * Pflichtfelder bewusst schlank gehalten (niedrigschwellige Erstanfrage):
 * Name, Unternehmen, E-Mail, gewünschtes Angebot, Nachricht, Datenschutz.
 * Alle weiteren Angaben sind optional.
 */

/** Auswahl "gewünschtes Angebot" – zentral gepflegt. */
export const requestOptions = [
  { value: "offensivtag", label: "Einzelner Offensivtag" },
  { value: "fuehrerschein", label: "Vollständiger Führungsführerschein" },
  { value: "unternehmenstag", label: "Handel-Offensivtag für das Unternehmen" },
  { value: "wirkungscheck", label: "Wirkungscheck" },
  { value: "impulsvortrag", label: "Impulsvortrag" },
  { value: "unsicher", label: "Noch nicht sicher" },
] as const;

export type RequestOptionValue = (typeof requestOptions)[number]["value"];

export type ContactFormValues = {
  name: string;
  unternehmen: string;
  email: string;
  angebot: string;
  nachricht: string;
  /** Optionale Angaben */
  funktion: string;
  telefon: string;
  standorte: string;
  teilnehmer: string;
  veranstaltungsort: string;
  datenschutz: boolean;
};

export type ContactFormState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      /** Feldbezogene, verständliche Fehlermeldungen */
      fieldErrors: Partial<Record<keyof ContactFormValues, string>>;
      /** Formularweite Fehlermeldung (z. B. Versandproblem) */
      formError?: string;
      /** Eingegebene Werte zum Wiederbefüllen des Formulars */
      values: Omit<ContactFormValues, "datenschutz">;
    };

const MAX_SHORT = 200;
const MAX_MESSAGE = 5000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function readFormValues(
  formData: FormData
): Omit<ContactFormValues, "datenschutz"> & { datenschutz: boolean } {
  const text = (name: string) =>
    String(formData.get(name) ?? "")
      .trim()
      .slice(0, name === "nachricht" ? MAX_MESSAGE : MAX_SHORT);
  return {
    name: text("name"),
    unternehmen: text("unternehmen"),
    email: text("email"),
    angebot: text("angebot"),
    nachricht: text("nachricht"),
    funktion: text("funktion"),
    telefon: text("telefon"),
    standorte: text("standorte"),
    teilnehmer: text("teilnehmer"),
    veranstaltungsort: text("veranstaltungsort"),
    datenschutz: formData.get("datenschutz") === "ja",
  };
}

export function validateContact(
  values: ReturnType<typeof readFormValues>
): Partial<Record<keyof ContactFormValues, string>> {
  const errors: Partial<Record<keyof ContactFormValues, string>> = {};

  if (!values.name) {
    errors.name = "Bitte geben Sie Ihren Namen an.";
  }
  if (!values.unternehmen) {
    errors.unternehmen = "Bitte geben Sie Ihr Unternehmen an.";
  }
  if (!values.email) {
    errors.email = "Bitte geben Sie Ihre geschäftliche E-Mail-Adresse an.";
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors.email =
      "Diese E-Mail-Adresse sieht nicht vollständig aus. Bitte prüfen Sie die Schreibweise.";
  }
  if (
    values.angebot &&
    !requestOptions.some((option) => option.value === values.angebot)
  ) {
    errors.angebot = "Bitte wählen Sie einen Eintrag aus der Liste.";
  }
  if (!values.angebot) {
    errors.angebot = "Bitte wählen Sie aus, wofür Sie sich interessieren.";
  }
  if (!values.nachricht) {
    errors.nachricht =
      "Bitte beschreiben Sie kurz Ihre Ausgangssituation oder Ihr Anliegen.";
  }
  if (!values.datenschutz) {
    errors.datenschutz =
      "Bitte bestätigen Sie die Datenschutzerklärung, damit wir Ihre Anfrage bearbeiten dürfen.";
  }

  return errors;
}
