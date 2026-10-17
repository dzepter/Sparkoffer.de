/**
 * Gemeinsamer Zustand fuer useActionState-Formulare (Auth + Profil).
 * Fehlermeldungen sind IMMER deutsch und nutzerfreundlich – nie technische Codes.
 */

import type { ZodError } from "zod";

export interface FormState {
  /** Allgemeine Fehlermeldung (deutsch) */
  error: string | null;
  /** Erfolgsmeldung (deutsch), z. B. "Gespeichert." */
  success?: string | null;
  /** Feldbezogene Fehlermeldungen (Schluessel = Feldname im Formular) */
  fieldErrors?: Record<string, string>;
}

export const INITIAL_FORM_STATE: FormState = { error: null, success: null };

/** Zod-Fehler -> erste Meldung je Feld. */
export function fieldErrorsFromZod(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

/** FormData-Wert als String (leer, wenn nicht vorhanden oder Datei). */
export function formString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** Checkbox-Wert aus FormData (Browser sendet "on", wenn angehakt). */
export function formChecked(formData: FormData, name: string): boolean {
  const value = formData.get(name);
  return value === "on" || value === "true" || value === "1";
}
