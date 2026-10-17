"use client";

import { useActionState } from "react";

import type { VisibilityLevel } from "@handel-offensiv/types";
import { Button, FormField, Textarea } from "@handel-offensiv/ui";
import type { BlockConfigMap } from "@handel-offensiv/validation";

import { saveReflectionAction, type BlockActionState } from "@/features/lernen/actions";
import { formatDateTime } from "@/features/lernen/format";

import { BlockFrame, FormError, SavedNote } from "./block-frame";
import { VisibilityField } from "./visibility-field";

const INITIAL: BlockActionState = { ok: false, error: null };

export interface ReflectionBlockProps {
  blockId: string;
  lessonId: string;
  cohortId: string;
  required: boolean;
  done: boolean;
  config: BlockConfigMap["reflection"];
  entry: { body: string; visibility: VisibilityLevel; updated_at: string } | null;
}

/** Reflexionsfrage -> reflection_entries (Default privat, Sichtbarkeitswahl optional). */
export function ReflectionBlock({ blockId, lessonId, cohortId, required, done, config, entry }: ReflectionBlockProps) {
  const [state, formAction, pending] = useActionState(saveReflectionAction, INITIAL);
  const fe = state.fieldErrors ?? {};
  const textId = `refl-${blockId}`;

  return (
    <BlockFrame id={blockId} label="Reflexionsfrage" required={required} done={done}>
      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="blockId" value={blockId} />
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="cohortId" value={cohortId} />
        <FormError message={state.error} />
        <FormField
          htmlFor={textId}
          label={config.question}
          error={fe.body}
          hint={entry ? `Zuletzt gespeichert am ${formatDateTime(entry.updated_at)}.` : "Ihre Gedanken bleiben privat, solange Sie nichts anderes wählen."}
        >
          <Textarea id={textId} name="body" rows={5} maxLength={5000} defaultValue={entry?.body ?? ""} invalid={Boolean(fe.body)} required />
        </FormField>
        {config.allowVisibilityChoice ? (
          <VisibilityField name="visibility" value={entry?.visibility ?? config.visibilityDefault} idPrefix={`refl-vis-${blockId}`} />
        ) : (
          <p className="text-xs text-ink-soft">
            {config.visibilityDefault === "trainer" ? "Diese Reflexion ist für Ihren Trainer sichtbar." : "Diese Reflexion ist nur für Sie sichtbar."}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Wird gespeichert …" : "Speichern"}
          </Button>
          <SavedNote savedAt={state.savedAt} />
        </div>
      </form>
    </BlockFrame>
  );
}
