"use client";

import { useActionState } from "react";

import { Button, cn } from "@handel-offensiv/ui";
import type { BlockConfigMap } from "@handel-offensiv/validation";

import { saveChoiceAction, type BlockActionState } from "@/features/lernen/actions";

import { BlockFrame, FormError } from "./block-frame";

const INITIAL: BlockActionState = { ok: false, error: null };

export interface ChoiceBlockProps {
  blockId: string;
  lessonId: string;
  cohortId: string;
  required: boolean;
  done: boolean;
  kind: "single_choice" | "multiple_choice";
  config: BlockConfigMap["single_choice"] | BlockConfigMap["multiple_choice"];
  /** Gespeicherte Auswahl (block_responses) */
  selected: string[];
}

/**
 * Inline-Frage (Single/Multiple Choice). Die Auswahl wird gespeichert; danach
 * zeigt der Block sofort Rueckmeldung aus config.options.correct (nicht geheim).
 */
export function ChoiceBlock({ blockId, lessonId, cohortId, required, done, kind, config, selected }: ChoiceBlockProps) {
  const [state, formAction, pending] = useActionState(saveChoiceAction, INITIAL);
  const multiple = kind === "multiple_choice";
  const selectedSet = new Set(selected);
  const answered = selected.length > 0;
  const hasKey = config.options.some((o) => o.correct !== undefined);
  const correctIds = new Set(config.options.filter((o) => o.correct === true).map((o) => o.id));
  const isCorrect = answered && hasKey && correctIds.size === selectedSet.size && [...selectedSet].every((id) => correctIds.has(id));

  return (
    <BlockFrame id={blockId} label="Frage" required={required} done={done}>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="blockId" value={blockId} />
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="cohortId" value={cohortId} />
        <input type="hidden" name="kind" value={kind} />
        <FormError message={state.error} />
        <fieldset>
          <legend className="text-base font-bold text-ink">{config.question}</legend>
          <p className="mt-1 text-xs text-ink-soft">{multiple ? "Mehrere Antworten möglich." : "Eine Antwort wählbar."}</p>
          <ul className="mt-3 space-y-2">
            {config.options.map((option) => {
              const chosen = selectedSet.has(option.id);
              const showFeedback = answered && hasKey;
              const tone = showFeedback
                ? option.correct === true
                  ? "border-success bg-success/5"
                  : chosen
                    ? "border-danger bg-danger/5"
                    : "border-line"
                : "border-line hover:border-navy";
              return (
                <li key={option.id}>
                  <label className={cn("flex min-h-touch cursor-pointer items-start gap-3 rounded border bg-white px-3 py-2.5", tone)}>
                    <input
                      type={multiple ? "checkbox" : "radio"}
                      name="selected"
                      value={option.id}
                      defaultChecked={chosen}
                      className="mt-0.5 h-5 w-5 shrink-0 accent-navy"
                    />
                    <span className="text-sm leading-5 text-ink">
                      {option.label}
                      {showFeedback && option.correct === true ? <span className="sr-only"> (richtig)</span> : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
        {answered && hasKey ? (
          <div role="status" className={cn("rounded border px-3 py-2 text-sm", isCorrect ? "border-success/40 bg-success/5 text-ink" : "border-warning/40 bg-warning/5 text-ink")}>
            <span className="font-bold">{isCorrect ? "Richtig." : "Nicht ganz."}</span>
            {config.explanation ? <span> {config.explanation}</span> : null}
          </div>
        ) : null}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Wird gespeichert …" : answered ? "Antwort ändern" : "Antwort speichern"}
        </Button>
      </form>
    </BlockFrame>
  );
}
