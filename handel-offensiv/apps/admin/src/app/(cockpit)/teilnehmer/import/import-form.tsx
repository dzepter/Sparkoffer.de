"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Badge, Button, FormField, Select } from "@/components/ui";
import { csvImportAction, csvPreviewAction, type CsvImportState } from "../actions";

export interface ImportOrgOption {
  id: string;
  name: string;
}
export interface ImportCohortOption {
  id: string;
  name: string;
  organizationId: string;
}

const INITIAL: CsvImportState = { step: "start", error: null };

/**
 * CSV-Import (§22) in zwei Schritten:
 *  1. Datei hochladen -> serverseitiges Parsen -> Vorschau mit Fehlermarkierung
 *  2. Import erst nach ausdruecklicher Bestaetigung (nur fehlerfreie Zeilen)
 */
export function ImportForm({
  organizations,
  cohorts,
}: {
  organizations: ImportOrgOption[];
  cohorts: ImportCohortOption[];
}) {
  const [previewState, previewAction, previewPending] = useActionState(csvPreviewAction, INITIAL);
  const [importState, importAction, importPending] = useActionState(csvImportAction, INITIAL);
  const [orgId, setOrgId] = useState(organizations[0]?.id ?? "");

  const orgCohorts = cohorts.filter((c) => c.organizationId === orgId);

  /* -------- Schritt 3: Ergebnis -------- */
  if (importState.step === "done") {
    return (
      <div className="max-w-2xl space-y-4">
        <p
          role="status"
          className="rounded border border-success/40 bg-success/10 px-4 py-3 text-sm text-ink"
        >
          <span className="font-bold">{importState.imported ?? 0} Einladungen versendet.</span>
        </p>
        {importState.failed && importState.failed.length > 0 ? (
          <div role="alert" className="rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-ink">
            <p className="font-bold text-danger">
              {importState.failed.length} Einladungen konnten nicht versendet werden:
            </p>
            <ul className="mt-1 list-inside list-disc">
              {importState.failed.map((email) => (
                <li key={email}>{email}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <Link
          href="/teilnehmer"
          className="inline-flex min-h-touch items-center justify-center rounded bg-green px-5 text-sm font-bold uppercase tracking-kicker text-dark hover:bg-green-bright"
        >
          Zur Teilnehmerliste
        </Link>
      </div>
    );
  }

  /* -------- Schritt 2: Vorschau -------- */
  if (previewState.step === "preview" && previewState.rows) {
    const rows = previewState.rows;
    const validRows = rows.filter((r) => r.errors.length === 0);
    return (
      <div className="space-y-4">
        {importState.error ? (
          <p role="alert" className="rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
            {importState.error}
          </p>
        ) : null}

        <p className="text-sm text-ink">
          <span className="font-bold">{validRows.length}</span> von{" "}
          <span className="font-bold">{rows.length}</span> Zeilen können importiert werden.
          Fehlerhafte Zeilen werden übersprungen.
        </p>

        <div className="overflow-x-auto rounded border border-line bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">Vorschau des CSV-Imports</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-kicker text-ink-soft">
                  Zeile
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-kicker text-ink-soft">
                  Vorname
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-kicker text-ink-soft">
                  Nachname
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-kicker text-ink-soft">
                  E-Mail
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-kicker text-ink-soft">
                  Prüfung
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={`${r.line}-${r.email}`}
                  className={
                    r.errors.length > 0
                      ? "border-b border-line/60 bg-danger/5 last:border-b-0"
                      : "border-b border-line/60 last:border-b-0"
                  }
                >
                  <td className="px-4 py-2.5 tabular-nums text-ink-soft">{r.line}</td>
                  <td className="px-4 py-2.5 text-ink">{r.firstName || "–"}</td>
                  <td className="px-4 py-2.5 text-ink">{r.lastName || "–"}</td>
                  <td className="px-4 py-2.5 text-ink">{r.email || "–"}</td>
                  <td className="px-4 py-2.5">
                    {r.errors.length === 0 ? (
                      <Badge tone="success">OK</Badge>
                    ) : (
                      <span className="text-xs font-bold text-danger">{r.errors.join(" · ")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={importAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="organizationId" value={previewState.organizationId ?? ""} />
          <input type="hidden" name="cohortId" value={previewState.cohortId ?? ""} />
          <input
            type="hidden"
            name="rowsJson"
            value={JSON.stringify(
              validRows.map((r) => ({
                firstName: r.firstName,
                lastName: r.lastName,
                email: r.email,
              })),
            )}
          />
          <Button type="submit" disabled={importPending || validRows.length === 0}>
            {importPending
              ? "Import läuft …"
              : `${validRows.length} ${validRows.length === 1 ? "Person" : "Personen"} einladen`}
          </Button>
          <Link
            href="/teilnehmer/import"
            className="inline-flex min-h-touch items-center rounded px-4 text-sm font-bold uppercase tracking-kicker text-ink-soft hover:bg-paper hover:text-ink"
          >
            Andere Datei wählen
          </Link>
        </form>
      </div>
    );
  }

  /* -------- Schritt 1: Upload -------- */
  return (
    <form action={previewAction} className="max-w-xl space-y-5" noValidate>
      {previewState.error ? (
        <p role="alert" className="rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
          {previewState.error}
        </p>
      ) : null}

      <FormField htmlFor="imp-org" label="Organisation" required>
        <Select id="imp-org" name="organizationId" value={orgId} onChange={(e) => setOrgId(e.target.value)} required>
          <option value="" disabled>
            Bitte wählen
          </option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        htmlFor="imp-cohort"
        label="Gruppe (optional)"
        hint="Alle importierten Personen werden nach Annahme dieser Gruppe zugeordnet."
      >
        <Select id="imp-cohort" name="cohortId" defaultValue="">
          <option value="">Keine Gruppe</option>
          {orgCohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        htmlFor="imp-file"
        label="CSV-Datei"
        required
        hint="Spalten: Vorname; Nachname; E-Mail. Semikolon oder Komma als Trennzeichen, max. 1 MB."
      >
        <input
          id="imp-file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="block w-full min-h-touch rounded border border-line bg-white px-3 py-2.5 text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-green file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:tracking-kicker file:text-dark"
        />
      </FormField>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={previewPending}>
          {previewPending ? "Wird geprüft …" : "Datei prüfen"}
        </Button>
        <Link
          href="/teilnehmer"
          className="inline-flex min-h-touch items-center rounded px-4 text-sm font-bold uppercase tracking-kicker text-ink-soft hover:bg-paper hover:text-ink"
        >
          Abbrechen
        </Link>
      </div>
    </form>
  );
}
