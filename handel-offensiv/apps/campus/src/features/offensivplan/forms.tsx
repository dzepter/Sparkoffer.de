"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";

import type { ActionPlanItemRow, PlanItemStatus } from "@handel-offensiv/types";
import { Badge, Banner, Button, Checkbox, FormField, Input, Textarea, cn } from "@handel-offensiv/ui";

import { INITIAL_FORM_STATE } from "@/lib/auth/form-state";

import { deleteItemAction, saveItemAction, setItemStatusAction, toggleShareAction } from "./actions";
import {
  PLAN_FIELDS,
  STATUS_STEPS,
  dueDateInputValue,
  fieldValuesFromItem,
  formatDueDate,
  isOverdue,
  statusLabel,
  type ItemFeedback,
} from "./shared";

/** Plan-Bezug fuer Formulare: Modul-UUID oder null (90-Tage-Plan). */
export interface PlanScope {
  cohortId: string;
  moduleId: string | null;
}

/* -------------------------------- Editor --------------------------------- */

/**
 * Formular fuer ein Vorhaben (fuenf Felder + "Bis wann"). Nach erfolgreichem
 * Speichern ruft es onDone auf – die Seite zeigt dann die aktualisierten
 * Daten (revalidatePath).
 */
export function PlanItemEditor({
  scope,
  item,
  onDone,
  title,
}: {
  scope: PlanScope;
  /** null = neues Vorhaben */
  item: ActionPlanItemRow | null;
  onDone: () => void;
  title: string;
}) {
  const [state, formAction, pending] = useActionState(saveItemAction, INITIAL_FORM_STATE);
  const fe = state.fieldErrors ?? {};
  const prefix = useId();
  const values = fieldValuesFromItem(item);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} noValidate className="space-y-4 border-t border-line pt-4">
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      <input type="hidden" name="cohortId" value={scope.cohortId} />
      <input type="hidden" name="moduleId" value={scope.moduleId ?? ""} />
      <input type="hidden" name="itemId" value={item?.id ?? ""} />

      {PLAN_FIELDS.map((field) => {
        const id = `${prefix}-${field.key}`;
        const required = field.key === "action";
        return (
          <FormField
            key={field.key}
            htmlFor={id}
            label={field.label}
            required={required}
            error={fe[field.key]}
            hint={required ? "Pflichtfeld – Ihr konkreter nächster Schritt." : undefined}
          >
            <Textarea
              id={id}
              name={field.key}
              rows={2}
              maxLength={2000}
              required={required}
              defaultValue={values[field.key]}
              placeholder={field.hint}
              invalid={fe[field.key] !== undefined}
            />
          </FormField>
        );
      })}

      <FormField htmlFor={`${prefix}-dueAt`} label="Bis wann" error={fe.dueAt} hint="Optional. Ein konkretes Datum hilft beim Dranbleiben.">
        <Input id={`${prefix}-dueAt`} name="dueAt" type="date" defaultValue={dueDateInputValue(item?.due_at ?? null)} invalid={fe.dueAt !== undefined} className="sm:max-w-xs" />
      </FormField>

      {state.error && !state.fieldErrors ? <Banner kind="error" message={state.error} /> : null}
      {state.error && state.fieldErrors ? <Banner kind="error" message={state.error} /> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Wird gespeichert …" : "Speichern"}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={onDone} className="w-full sm:w-auto">
          Abbrechen
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------ Vorhaben-Karte ---------------------------- */

/**
 * Ein Vorhaben in der Ansicht: Felder, Status-Stepper, Trainer-Feedback,
 * Bearbeiten/Entfernen. Der Editor oeffnet sich an Ort und Stelle.
 */
export function PlanItemCard({
  scope,
  item,
  feedback,
  index,
  canDelete,
}: {
  scope: PlanScope;
  item: ActionPlanItemRow;
  feedback: ItemFeedback[];
  /** Laufende Nummer innerhalb des Plans (1-basiert) */
  index: number;
  canDelete: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const overdue = isOverdue(item.due_at, item.status);

  if (editing) {
    return (
      <article className="rounded border border-line bg-paper p-4">
        <PlanItemEditor scope={scope} item={item} title={`Vorhaben ${index} bearbeiten`} onDone={() => setEditing(false)} />
      </article>
    );
  }

  return (
    <article className="space-y-4 rounded border border-line bg-white p-4" aria-label={`Vorhaben ${index}: ${item.action ?? ""}`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">Vorhaben {index}</p>
          <h3 className="mt-0.5 text-base font-bold text-ink">{item.action?.trim() || "Ohne Maßnahme"}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {item.due_at ? <Badge tone={overdue ? "warning" : "neutral"}>{overdue ? "Überfällig · " : "Bis "}{formatDueDate(item.due_at)}</Badge> : null}
          <Badge tone={item.status === "planned" ? "neutral" : item.status === "reflected" ? "success" : "brand"}>{statusLabel(item.status)}</Badge>
        </div>
      </header>

      <dl className="grid gap-3 sm:grid-cols-2">
        {PLAN_FIELDS.filter((f) => f.key !== "action").map((field) => {
          const raw = item[field.key];
          return (
            <div key={field.key}>
              <dt className="text-xs font-bold uppercase tracking-kicker text-ink-soft">{field.label}</dt>
              <dd className={cn("mt-0.5 whitespace-pre-line text-sm", raw && raw.trim().length > 0 ? "text-ink" : "text-ink-soft/70")}>
                {raw && raw.trim().length > 0 ? raw : "Noch nicht ausgefüllt"}
              </dd>
            </div>
          );
        })}
      </dl>

      <StatusStepper scope={scope} itemId={item.id} status={item.status} />

      {feedback.length > 0 ? (
        <section aria-label="Feedback Ihres Trainers" className="space-y-2 border-l-2 border-gold bg-paper p-3">
          <p className="text-xs font-bold uppercase tracking-kicker text-gold-deep">Feedback Ihres Trainers</p>
          {feedback.map((fb) => (
            <div key={fb.id}>
              <p className="whitespace-pre-line text-sm text-ink">{fb.body}</p>
              <p className="mt-0.5 text-xs text-ink-soft">{formatDueDate(fb.created_at)}</p>
            </div>
          ))}
        </section>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center">
        <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(true)} className="min-h-touch sm:min-h-[36px]">
          Bearbeiten
        </Button>
        {canDelete ? <DeleteItemForm scope={scope} itemId={item.id} /> : null}
      </div>
    </article>
  );
}

/* ------------------------------ Neues Vorhaben ---------------------------- */

export function NewItemToggle({ scope, label, hint }: { scope: PlanScope; label: string; hint?: string }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="rounded border border-line bg-paper p-4">
        <PlanItemEditor scope={scope} item={null} title="Neues Vorhaben" onDone={() => setOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {hint ? <p className="text-sm text-ink-soft">{hint}</p> : null}
      <Button type="button" variant="secondary" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        {label}
      </Button>
    </div>
  );
}

/* ------------------------------ Status-Stepper ---------------------------- */

function StatusStepper({ scope, itemId, status }: { scope: PlanScope; itemId: string; status: PlanItemStatus }) {
  const [state, formAction, pending] = useActionState(setItemStatusAction, INITIAL_FORM_STATE);
  const currentIndex = STATUS_STEPS.findIndex((s) => s.value === status);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="cohortId" value={scope.cohortId} />
      <input type="hidden" name="itemId" value={itemId} />
      <fieldset disabled={pending}>
        <legend className="mb-1.5 text-xs font-bold uppercase tracking-kicker text-ink-soft">Status: {statusLabel(status)}</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Status setzen">
          {STATUS_STEPS.map((step, i) => {
            const isCurrent = i === currentIndex;
            const isReached = i < currentIndex;
            return (
              <button
                key={step.value}
                type="submit"
                name="status"
                value={step.value}
                aria-pressed={isCurrent}
                aria-label={`Status auf ${step.label} setzen`}
                className={cn(
                  "inline-flex min-h-touch items-center gap-1.5 rounded border px-3 text-xs font-bold uppercase tracking-kicker transition-colors disabled:opacity-60",
                  isCurrent ? "border-navy bg-navy text-paper" : isReached ? "border-gold-deep bg-paper text-gold-deep" : "border-line bg-white text-ink-soft hover:border-ink",
                )}
              >
                {isCurrent || isReached ? <span aria-hidden="true">✓</span> : null}
                {step.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      {state.error ? <Banner kind="error" message={state.error} /> : null}
    </form>
  );
}

/* --------------------------------- Loeschen ------------------------------- */

function DeleteItemForm({ scope, itemId }: { scope: PlanScope; itemId: string }) {
  const [state, formAction, pending] = useActionState(deleteItemAction, INITIAL_FORM_STATE);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      onSubmit={(e) => {
        if (!window.confirm("Dieses Vorhaben wird aus Ihrem Offensivplan entfernt. Möchten Sie fortfahren?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="cohortId" value={scope.cohortId} />
      <input type="hidden" name="itemId" value={itemId} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending} className="min-h-touch sm:min-h-[36px]">
        {pending ? "Wird entfernt …" : "Entfernen"}
      </Button>
      {state.error ? <Banner kind="error" message={state.error} /> : null}
    </form>
  );
}

/* ------------------------------ Mit Trainer teilen ------------------------ */

/**
 * Freigabe je Plan. Erklaert, was der Trainer sieht: die Vorhaben dieses
 * Plans (fuenf Felder, Status, Bis wann) – nicht Reflexionen oder private
 * Abgaben. Die Checkbox sendet das Formular direkt ab; der Wert wandert
 * ueber ein verstecktes Feld "share" (true/false).
 */
export function ShareToggle({ scope, shared }: { scope: PlanScope; shared: boolean }) {
  const [state, formAction, pending] = useActionState(toggleShareAction, INITIAL_FORM_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const shareRef = useRef<HTMLInputElement>(null);
  const id = useId();

  return (
    <form ref={formRef} action={formAction} className="space-y-2 border-t border-line pt-3">
      <input type="hidden" name="cohortId" value={scope.cohortId} />
      <input type="hidden" name="moduleId" value={scope.moduleId ?? ""} />
      <input ref={shareRef} type="hidden" name="share" defaultValue={shared ? "true" : "false"} />
      <Checkbox
        id={`${id}-share`}
        defaultChecked={shared}
        disabled={pending}
        onChange={(e) => {
          if (shareRef.current) shareRef.current.value = e.currentTarget.checked ? "true" : "false";
          formRef.current?.requestSubmit();
        }}
        label={<span className="font-bold">Mit Trainer teilen</span>}
        description={
          shared
            ? "Ihr Trainer sieht die Vorhaben dieses Plans – die fünf Felder, den Status und „Bis wann“ – und kann Ihnen Feedback geben. Ihre Reflexionen und privaten Abgaben bleiben privat. Sie können das Teilen jederzeit beenden."
            : "Standardmäßig privat. Wenn Sie teilen, sieht Ihr Trainer die Vorhaben dieses Plans – die fünf Felder, den Status und „Bis wann“ – und kann Ihnen Feedback geben. Reflexionen und private Abgaben bleiben davon unberührt."
        }
      />
      {pending ? <p className="text-xs text-ink-soft">Wird gespeichert …</p> : null}
      {!pending && state.success ? <Banner kind="success" message={state.success} /> : null}
      {!pending && state.error ? <Banner kind="error" message={state.error} /> : null}
    </form>
  );
}
