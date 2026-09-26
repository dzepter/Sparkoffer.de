"use client";

import { useActionState } from "react";

import { Badge, Button, FormField, Textarea } from "@handel-offensiv/ui";
import type { BlockConfigMap } from "@handel-offensiv/validation";

import { saveTransferTaskAction, type BlockActionState } from "@/features/lernen/actions";
import type { SubmissionView } from "@/features/lernen/data";
import { formatDateTime, formatDue } from "@/features/lernen/format";

import { BlockFrame, FormError, SavedNote } from "./block-frame";
import { UploadField } from "./upload-field";
import { VisibilityField } from "./visibility-field";

const INITIAL: BlockActionState = { ok: false, error: null };

export interface TransferTaskBlockProps {
  blockId: string;
  lessonId: string;
  cohortId: string;
  uploadPrefix: string;
  required: boolean;
  done: boolean;
  config: BlockConfigMap["transfer_task"];
  submission: SubmissionView | null;
  /** Faelligkeit (ISO) aus config.dueAt bzw. lesson_releases.due_at */
  dueAt: string | null;
}

function answerOf(submission: SubmissionView | null, id: string): string {
  const v = submission?.answers[id];
  return typeof v === "string" ? v : "";
}

/**
 * Transferaufgabe (§11): Beschreibung, Faelligkeit, Text-Nachweis mit
 * strukturierten Nachfragen, Sichtbarkeit, optional Datei/Foto; Feedback des
 * Trainers wird unter der Abgabe angezeigt.
 */
export function TransferTaskBlock({ blockId, lessonId, cohortId, uploadPrefix, required, done, config, submission, dueAt }: TransferTaskBlockProps) {
  const [state, formAction, pending] = useActionState(saveTransferTaskAction, INITIAL);
  const fe = state.fieldErrors ?? {};
  const allowFiles = config.evidence.file || config.evidence.image;

  return (
    <BlockFrame id={blockId} label="Transferaufgabe" required={required} done={done}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-bold text-ink">{config.title}</h3>
        {dueAt ? <Badge tone="brand">{formatDue(dueAt)}</Badge> : null}
      </div>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">{config.description}</p>

      <form action={formAction} className="mt-4 space-y-4" noValidate>
        <input type="hidden" name="blockId" value={blockId} />
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="cohortId" value={cohortId} />
        <FormError message={state.error} />

        {config.evidence.text ? (
          <FormField htmlFor={`tt-note-${blockId}`} label="Was haben Sie umgesetzt?" error={fe.noteText} required={config.evidence.text && (config.followUpQuestions ?? []).length === 0}>
            <Textarea id={`tt-note-${blockId}`} name="noteText" rows={4} maxLength={5000} defaultValue={submission?.note_text ?? ""} invalid={Boolean(fe.noteText)} />
          </FormField>
        ) : null}

        {(config.followUpQuestions ?? []).map((q) => (
          <FormField key={q.id} htmlFor={`tt-fq-${blockId}-${q.id}`} label={q.label} error={fe[`fq_${q.id}`]}>
            <Textarea id={`tt-fq-${blockId}-${q.id}`} name={`fq_${q.id}`} rows={3} maxLength={2000} defaultValue={answerOf(submission, q.id)} invalid={Boolean(fe[`fq_${q.id}`])} />
          </FormField>
        ))}

        <VisibilityField name="visibility" value={submission?.visibility ?? "private"} idPrefix={`tt-vis-${blockId}`} />

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Wird gespeichert …" : submission ? "Abgabe aktualisieren" : "Abgabe speichern"}
          </Button>
          <SavedNote savedAt={state.savedAt} />
          {submission ? <span className="text-xs text-ink-soft">Zuletzt gespeichert am {formatDateTime(submission.updated_at)}.</span> : null}
        </div>
      </form>

      {allowFiles ? (
        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-sm font-bold text-ink">{config.evidence.image && !config.evidence.file ? "Foto als Nachweis (optional)" : "Datei oder Foto als Nachweis (optional)"}</p>
          <UploadField
            blockId={blockId}
            lessonId={lessonId}
            cohortId={cohortId}
            uploadPrefix={uploadPrefix}
            photosOnly={config.evidence.image && !config.evidence.file}
            maxFiles={5}
            files={submission?.files ?? []}
          />
        </div>
      ) : null}

      {submission && submission.feedback.length > 0 ? (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">Feedback Ihres Trainers</p>
          <ul className="mt-2 space-y-2">
            {submission.feedback.map((f) => (
              <li key={f.id} className="rounded border-l-[3px] border-navy bg-paper px-3 py-2">
                <p className="whitespace-pre-line text-sm text-ink">{f.body}</p>
                <p className="mt-1 text-xs text-ink-soft">{formatDateTime(f.created_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </BlockFrame>
  );
}
