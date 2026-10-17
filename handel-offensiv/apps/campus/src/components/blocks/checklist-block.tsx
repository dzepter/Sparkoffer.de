"use client";

import { useActionState } from "react";

import { Button, Checkbox } from "@handel-offensiv/ui";
import type { BlockConfigMap } from "@handel-offensiv/validation";

import { saveChecklistAction, type BlockActionState } from "@/features/lernen/actions";

import { BlockFrame, FormError, SavedNote } from "./block-frame";

const INITIAL: BlockActionState = { ok: false, error: null };

export interface ChecklistBlockProps {
  blockId: string;
  lessonId: string;
  cohortId: string;
  required: boolean;
  done: boolean;
  config: BlockConfigMap["checklist"];
  /** Bereits abgehakte Item-IDs (block_responses) */
  checked: string[];
}

/** Checkliste – Haken werden in block_responses gespeichert (Button "Speichern"). */
export function ChecklistBlock({ blockId, lessonId, cohortId, required, done, config, checked }: ChecklistBlockProps) {
  const [state, formAction, pending] = useActionState(saveChecklistAction, INITIAL);
  const checkedSet = new Set(checked);

  return (
    <BlockFrame id={blockId} label="Checkliste" required={required} done={done}>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="blockId" value={blockId} />
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="cohortId" value={cohortId} />
        <FormError message={state.error} />
        <ul className="divide-y divide-line">
          {config.items.map((item) => (
            <li key={item.id}>
              <Checkbox id={`chk-${blockId}-${item.id}`} name="items" value={item.id} defaultChecked={checkedSet.has(item.id)} label={item.label} />
            </li>
          ))}
        </ul>
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
