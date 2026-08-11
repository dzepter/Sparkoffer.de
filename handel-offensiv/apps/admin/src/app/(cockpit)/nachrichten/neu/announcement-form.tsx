"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, Checkbox, FormField, Input, Select, Textarea } from "@/components/ui";
import { createAnnouncementAction, type AnnouncementFormState } from "../actions";

export interface AnnouncementCohortOption {
  id: string;
  name: string;
}

const INITIAL: AnnouncementFormState = { error: null };

/** Formular: Titel + Text + Zielgruppe + optionaler Push (§19). */
export function AnnouncementForm({ cohorts }: { cohorts: AnnouncementCohortOption[] }) {
  const [state, formAction, pending] = useActionState(createAnnouncementAction, INITIAL);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-xl space-y-5" noValidate>
      {state.error ? (
        <p
          role="alert"
          className="rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <FormField htmlFor="ank-gruppe" label="Zielgruppe" required error={fe.cohortId}>
        <Select
          id="ank-gruppe"
          name="cohortId"
          defaultValue={cohorts.length === 1 ? cohorts[0]?.id : ""}
          invalid={Boolean(fe.cohortId)}
          required
        >
          <option value="" disabled>
            Bitte wählen
          </option>
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField htmlFor="ank-titel" label="Titel" required error={fe.title}>
        <Input
          id="ank-titel"
          name="title"
          maxLength={160}
          invalid={Boolean(fe.title)}
          placeholder="z. B. Treffpunkt für Tag 2"
          required
        />
      </FormField>

      <FormField htmlFor="ank-text" label="Text" required error={fe.body}>
        <Textarea
          id="ank-text"
          name="body"
          rows={6}
          maxLength={4000}
          invalid={Boolean(fe.body)}
          placeholder="Was soll die Gruppe wissen?"
          required
        />
      </FormField>

      <Checkbox
        id="ank-push"
        name="sendPush"
        label="Zusätzlich Push-Benachrichtigung senden"
        description="Bitte sparsam einsetzen: Push-Nachrichten unterbrechen die Teilnehmer im Alltag. Sie eignen sich für Terminänderungen und wirklich Wichtiges – nicht für jede Neuigkeit."
      />

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Wird veröffentlicht …" : "Veröffentlichen"}
        </Button>
        <Link
          href="/nachrichten"
          className="inline-flex min-h-touch items-center rounded px-4 text-sm font-bold uppercase tracking-kicker text-ink-soft hover:bg-paper hover:text-ink"
        >
          Abbrechen
        </Link>
      </div>
    </form>
  );
}
