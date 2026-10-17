/**
 * Neutrale Hinweise auf der Login-Seite (?hinweis=…).
 * Nur bekannte Schluessel werden angezeigt – nie Freitext aus der URL.
 */

import type { BannerKind } from "@handel-offensiv/ui";

export interface LoginHinweis {
  kind: BannerKind;
  text: string;
}

export const LOGIN_HINWEISE: Record<string, LoginHinweis> = {
  "passwort-gesetzt": {
    kind: "success",
    text: "Ihr neues Passwort wurde gespeichert. Bitte melden Sie sich damit an.",
  },
  "link-ungueltig": {
    kind: "warning",
    text: "Dieser Link ist nicht mehr gültig. Bitte fordern Sie über „Passwort vergessen?“ einen neuen an.",
  },
  abgemeldet: {
    kind: "info",
    text: "Sie wurden abgemeldet. Bis zum nächsten Mal.",
  },
  "konto-vorhanden": {
    kind: "info",
    text: "Sie besitzen bereits ein Konto. Die Einladung wurde mit Ihrem bestehenden Zugang verknüpft – bitte melden Sie sich mit Ihrem bisherigen Passwort an.",
  },
  "zugang-angelegt": {
    kind: "success",
    text: "Ihr Zugang wurde eingerichtet. Bitte melden Sie sich mit Ihrer E-Mail-Adresse und Ihrem neuen Passwort an.",
  },
  "sitzung-abgelaufen": {
    kind: "info",
    text: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
  },
  "konto-gesperrt": {
    kind: "warning",
    text: "Ihr Zugang ist derzeit nicht aktiv. Bitte wenden Sie sich an Ihre Ansprechperson.",
  },
};

export function loginHinweis(key: string | undefined): LoginHinweis | null {
  if (key === undefined) return null;
  return LOGIN_HINWEISE[key] ?? null;
}
