"use client";

import { useActionState } from "react";

import { Button, cn } from "@handel-offensiv/ui";
import type { BlockConfigMap } from "@handel-offensiv/validation";

import { saveScaleAction, type BlockActionState } from "@/features/lernen/actions";

import { BlockFrame, FormError, SavedNote } from "./block-frame";

const INITIAL: BlockActionState = { ok: false, error: null };

export interface ScaleBlockProps {
  blockId: string;
  lessonId: string;
  cohortId: string;
  required: boolean;
  done: boolean;
  config: BlockConfigMap["scale"];
  value: number | null;
}

/** Selbsteinschaetzung auf einer Skala (Radiogruppe, 44-px-Ziele). */
export function ScaleBlock({ blockId, lessonId, cohortId, required, done, config, value }: ScaleBlockProps) {
  const [state, formAction, pending] = useActionState(saveScaleAction, INITIAL);
  const values: number[] = [];
  for (let v = config.min; v <= config.max; v += 1) values.push(v);

  return (
    <BlockFrame id={blockId} label="Einschätzung" required={required} done={done}>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="blockId" value={blockId} />
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="cohortId" value={cohortId} />
        <FormError message={state.error} />
        <fieldset>
          <legend className="text-base font-bold text-ink">{config.question}</legend>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={config.question}>
            {values.map((v) => (
              <label
                key={v}
                className={cn(
                  "flex min-h-touch min-w-touch cursor-pointer items-center justify-center rounded border px-3 text-sm font-bold",
                  "border-line bg-white text-ink hover:border-navy",
                  "has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-white",
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-navy has-[:focus-visible]:ring-offset-2",
                )}
              >
                <input type="radio" name="value" value={v} defaultChecked={value === v} className="sr-only" />
                {v}
              </label>
            ))}
          </div>
          {config.minLabel || config.maxLabel ? (
            <div className="mt-2 flex justify-between text-xs text-ink-soft">
              <span>{config.minLabel ?? ""}</span>
              <span>{config.maxLabel ?? ""}</span>
            </div>
          ) : null}
        </fieldset>
        {config.shareWithTrainer ? (
          <p className="text-xs text-ink-soft">Ihre Einschätzung ist für Ihren Trainer einsehbar.</p>
        ) : null}
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
