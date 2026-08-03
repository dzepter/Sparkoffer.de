"use client";

import { useActionState, useEffect, useRef } from "react";
import { requestOptions, type ContactFormState } from "@/lib/contact";
import { submitContact } from "./actions";

const initialState: ContactFormState = { status: "idle" };

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-medium text-rot">
      {message}
    </p>
  );
}

const inputClass =
  "mt-1.5 w-full border border-line-strong bg-white px-4 py-3 text-ink placeholder:text-mute focus:border-ink aria-[invalid=true]:border-rot";
const labelClass = "block font-medium text-ink";

/**
 * Kontaktformular mit Server Action.
 * Bewusst wenige Pflichtfelder; weitere Angaben sind einklappbar.
 * Funktioniert dank Progressive Enhancement auch ohne JavaScript –
 * Vorauswahl und Anfragekontext kommen serverseitig als Props.
 */
export function ContactForm({
  preselected = "",
  context = "",
}: {
  preselected?: string;
  context?: string;
}) {
  const [state, formAction, pending] = useActionState(
    submitContact,
    initialState
  );
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const values = state.status === "error" ? state.values : undefined;
  const errors = state.status === "error" ? state.fieldErrors : {};
  const errorCount = Object.keys(errors).length;

  /* Optionale Angaben aufklappen, wenn dort bereits Werte stehen */
  const optionalOpen = Boolean(
    values?.funktion ||
      values?.telefon ||
      values?.standorte ||
      values?.teilnehmer ||
      values?.veranstaltungsort
  );

  useEffect(() => {
    if (state.status === "error") {
      errorSummaryRef.current?.focus();
    } else if (state.status === "success") {
      successRef.current?.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="border-l-4 border-gruen bg-paper-2 p-8"
      >
        <h2 className="display text-2xl text-ink">
          Vielen Dank – Ihre Anfrage ist angekommen.
        </h2>
        <p className="mt-4 leading-relaxed text-mute">
          Wir melden uns persönlich bei Ihnen, in der Regel innerhalb von ein
          bis zwei Werktagen. Wenn es eilt, erreichen Sie uns auch direkt per
          Telefon.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate>
      <p className="text-sm text-mute">
        Pflichtfelder sind mit <span aria-hidden="true">*</span>
        <span className="sr-only">Stern</span> gekennzeichnet.
      </p>

      {(state.status === "error" && (state.formError || errorCount > 0)) ? (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          className="mt-5 border-l-4 border-rot bg-paper-2 p-5"
        >
          <p className="font-semibold text-ink">
            {state.formError ??
              "Ihre Anfrage konnte noch nicht gesendet werden. Bitte prüfen Sie die markierten Felder."}
          </p>
        </div>
      ) : null}

      {/* Honeypot – für Menschen unsichtbar, von Bots häufig ausgefüllt */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor="firmenwebseite">
          Dieses Feld bitte frei lassen
          <input
            type="text"
            id="firmenwebseite"
            name="firmenwebseite"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      {context ? (
        <>
          {/* Anfragekontext aus der Verlinkung – wird in die Mail übernommen */}
          <input type="hidden" name="kontext" value={context} />
          <p className="mt-5 border-l-4 border-rot bg-paper-2 px-4 py-3 text-sm text-ink">
            Ihre Anfrage bezieht sich auf: <strong>{context}</strong>
          </p>
        </>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelClass}>
              Name&nbsp;*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              autoComplete="name"
              defaultValue={values?.name}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "fehler-name" : undefined}
              className={inputClass}
            />
            <FieldError id="fehler-name" message={errors.name} />
          </div>
          <div>
            <label htmlFor="unternehmen" className={labelClass}>
              Unternehmen&nbsp;*
            </label>
            <input
              type="text"
              id="unternehmen"
              name="unternehmen"
              required
              autoComplete="organization"
              defaultValue={values?.unternehmen}
              aria-invalid={errors.unternehmen ? true : undefined}
              aria-describedby={
                errors.unternehmen ? "fehler-unternehmen" : undefined
              }
              className={inputClass}
            />
            <FieldError id="fehler-unternehmen" message={errors.unternehmen} />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Geschäftliche E-Mail-Adresse&nbsp;*
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              autoComplete="email"
              defaultValue={values?.email}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "fehler-email" : undefined}
              className={inputClass}
            />
            <FieldError id="fehler-email" message={errors.email} />
          </div>
          <div>
            <label htmlFor="angebot" className={labelClass}>
              Gewünschtes Angebot&nbsp;*
            </label>
            <select
              id="angebot"
              name="angebot"
              required
              defaultValue={values?.angebot || preselected}
              aria-invalid={errors.angebot ? true : undefined}
              aria-describedby={errors.angebot ? "fehler-angebot" : undefined}
              className={inputClass}
            >
              <option value="">Bitte wählen …</option>
              {requestOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError id="fehler-angebot" message={errors.angebot} />
          </div>
        </div>

        <div>
          <label htmlFor="nachricht" className={labelClass}>
            Ihre Nachricht&nbsp;*
          </label>
          <textarea
            id="nachricht"
            name="nachricht"
            rows={6}
            required
            defaultValue={values?.nachricht}
            placeholder="Beschreiben Sie kurz Ihre Ausgangssituation: Wie viele Führungskräfte, welche Herausforderungen, welcher Zeitrahmen?"
            aria-invalid={errors.nachricht ? true : undefined}
            aria-describedby={errors.nachricht ? "fehler-nachricht" : undefined}
            className={inputClass}
          />
          <FieldError id="fehler-nachricht" message={errors.nachricht} />
        </div>

        {/* Optionale Angaben – einklappbar, um die Erstanfrage schlank zu halten */}
        <details
          open={optionalOpen || undefined}
          className="group border border-line bg-paper-2"
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-medium text-ink [&::-webkit-details-marker]:hidden">
            Weitere Angaben (optional)
            <span
              aria-hidden="true"
              className="shrink-0 text-rot transition-transform duration-200 group-open:rotate-45"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
          </summary>
          <div className="grid grid-cols-1 gap-5 border-t border-line p-4 sm:grid-cols-2">
            <div>
              <label htmlFor="funktion" className={labelClass}>
                Ihre Funktion
              </label>
              <input
                type="text"
                id="funktion"
                name="funktion"
                autoComplete="organization-title"
                defaultValue={values?.funktion}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="telefon" className={labelClass}>
                Telefonnummer
              </label>
              <input
                type="tel"
                id="telefon"
                name="telefon"
                autoComplete="tel"
                defaultValue={values?.telefon}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="standorte" className={labelClass}>
                Anzahl der Standorte
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="standorte"
                name="standorte"
                defaultValue={values?.standorte}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="teilnehmer" className={labelClass}>
                Mögliche Teilnehmer
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="teilnehmer"
                name="teilnehmer"
                defaultValue={values?.teilnehmer}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="veranstaltungsort" className={labelClass}>
                Bevorzugter Veranstaltungsort
              </label>
              <input
                type="text"
                id="veranstaltungsort"
                name="veranstaltungsort"
                placeholder="z. B. bei uns im Unternehmen"
                defaultValue={values?.veranstaltungsort}
                className={inputClass}
              />
            </div>
          </div>
        </details>
      </div>

      <div className="mt-6">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="datenschutz"
            name="datenschutz"
            value="ja"
            required
            aria-invalid={errors.datenschutz ? true : undefined}
            aria-describedby={
              errors.datenschutz ? "fehler-datenschutz" : "hinweis-datenschutz"
            }
            className="mt-1 h-5 w-5 shrink-0 accent-rot"
          />
          <label htmlFor="datenschutz" className="text-sm leading-relaxed text-ink">
            Ich habe die{" "}
            <a
              href="/datenschutz"
              className="underline decoration-rot decoration-2 underline-offset-2 hover:text-rot"
            >
              Datenschutzerklärung
            </a>{" "}
            gelesen und bin damit einverstanden, dass meine Angaben zur
            Bearbeitung meiner Anfrage verarbeitet werden.&nbsp;*
          </label>
        </div>
        <p id="hinweis-datenschutz" className="mt-2 text-sm text-mute">
          Ihre Daten werden ausschließlich zur Bearbeitung Ihrer Anfrage
          verwendet und nicht weitergegeben.
        </p>
        <FieldError id="fehler-datenschutz" message={errors.datenschutz} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-8 inline-flex min-h-12 w-full items-center justify-center bg-rot px-8 py-3.5 font-display font-semibold uppercase tracking-wider text-white transition-colors hover:bg-rot-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Wird gesendet …" : "Anfrage senden"}
      </button>
    </form>
  );
}
