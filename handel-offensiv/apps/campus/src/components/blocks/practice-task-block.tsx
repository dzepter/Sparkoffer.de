"use client";

import { useActionState } from "react";

import { Badge, Button } from "@handel-offensiv/ui";
import type { BlockConfigMap } from "@handel-offensiv/validation";

import { savePracticeTaskAction, type BlockActionState } from "@/features/lernen/actions";

import { BlockFrame, FormError } from "./block-frame";

const INITIAL: BlockActionState = { ok: false, error: null };

export interface PracticeTaskBlockProps {
  blockId: string;
  lessonId: string;
  cohortId: string;
  required: boolean;
  done: boolean;
  config: BlockConfigMap["practice_task"];
}

/** Praxisaufgabe ohne Nachweis: Text + "Erledigt"-Schalter (block_responses). */
export function PracticeTaskBlock({ blockId, lessonId, cohortId, required, done, config }: PracticeTaskBlockProps) {
  const [state, formAction, pending] = useActionState(savePracticeTaskAction, INITIAL);

  return (
    <BlockFrame id={blockId} label="Praxisaufgabe" required={required} done={done}>
      <h3 className="text-base font-bold text-ink">{config.title}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">{config.description}</p>
      <form action={formAction} className="mt-4 flex flex-wrap items-center gap-3">
        <input type="hidden" name="blockId" value={blockId} />
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="cohortId" value={cohortId} />
        <input type="hidden" name="done" value={done ? "false" : "true"} />
        <FormError message={state.error} />
        {done ? (
          <>
            <Badge tone="success">Erledigt</Badge>
            <Button type="submit" variant="ghost" size="sm" disabled={pending} aria-label="Erledigt-Markierung zurücknehmen">
              {pending ? "Wird gespeichert …" : "Zurücknehmen"}
            </Button>
          </>
        ) : (
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Wird gespeichert …" : "Als erledigt markieren"}
          </Button>
        )}
      </form>
    </BlockFrame>
  );
}
