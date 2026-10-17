"use client";

import { useActionState } from "react";

import type { NotificationKind } from "@handel-offensiv/types";
import { Banner, Button, Checkbox, FormField, Input, Textarea } from "@handel-offensiv/ui";

import { INITIAL_FORM_STATE, type FormState } from "@/lib/auth/form-state";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_KINDS,
  NOTIFICATION_KIND_LABELS,
  preferenceFieldName,
  type NotificationChannel,
} from "@/lib/auth/profile";
import type { CampusCohort } from "@/lib/session";

import {
  changePasswordAction,
  requestAccountDeletionAction,
  switchCohortAction,
  updateNotificationPreferencesAction,
  updateProfileNameAction,
} from "./actions";

/** Ergebnis-Zeile unter einem Formular (Erfolg oder Fehler). */
function Result({ state }: { state: FormState }) {
  if (state.success) return <Banner kind="success" message={state.success} />;
  if (state.error && !state.fieldErrors) return <Banner kind="error" message={state.error} />;
  return null;
}

/* ------------------------------- Stammdaten ------------------------------- */

export function ProfileNameForm({ firstName, lastName }: { firstName: string; lastName: string }) {
  const [state, formAction, pending] = useActionState(updateProfileNameAction, INITIAL_FORM_STATE);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField htmlFor="firstName" label="Vorname" required error={fe.firstName}>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            maxLength={100}
            defaultValue={firstName}
            invalid={fe.firstName !== undefined}
          />
        </FormField>
        <FormField htmlFor="lastName" label="Nachname" required error={fe.lastName}>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            maxLength={100}
            defaultValue={lastName}
            invalid={fe.lastName !== undefined}
          />
        </FormField>
      </div>
      <Result state={state} />
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Wird gespeichert …" : "Name speichern"}
      </Button>
    </form>
  );
}

/* ----------------------------- Aktive Gruppe ------------------------------ */

export function CohortSwitchForm({ cohorts, activeId }: { cohorts: CampusCohort[]; activeId: string | null }) {
  const [state, formAction, pending] = useActionState(switchCohortAction, INITIAL_FORM_STATE);

  return (
    <form action={formAction} noValidate className="space-y-4">
      <FormField htmlFor="cohortId" label="Aktive Gruppe" hint="Der Campus zeigt Programm, Termine und Offensivplan dieser Gruppe.">
        <select
          id="cohortId"
          name="cohortId"
          defaultValue={activeId ?? ""}
          className="block min-h-touch w-full rounded border border-line bg-white px-3 text-base text-ink focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy"
        >
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FormField>
      <Result state={state} />
      <Button type="submit" variant="secondary" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Wird gewechselt …" : "Gruppe wechseln"}
      </Button>
    </form>
  );
}

/* -------------------------------- Passwort -------------------------------- */

export function PasswordChangeForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, INITIAL_FORM_STATE);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-4">
      <FormField htmlFor="currentPassword" label="Aktuelles Passwort" required error={fe.currentPassword}>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          invalid={fe.currentPassword !== undefined}
        />
      </FormField>
      <FormField
        htmlFor="newPassword"
        label="Neues Passwort"
        required
        error={fe.newPassword}
        hint="Mindestens 10 Zeichen. Empfehlung: ein Satz, den nur Sie kennen."
      >
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          invalid={fe.newPassword !== undefined}
        />
      </FormField>
      <FormField htmlFor="newPasswordConfirm" label="Neues Passwort wiederholen" required error={fe.newPasswordConfirm}>
        <Input
          id="newPasswordConfirm"
          name="newPasswordConfirm"
          type="password"
          autoComplete="new-password"
          required
          invalid={fe.newPasswordConfirm !== undefined}
        />
      </FormField>
      <Result state={state} />
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Wird geändert …" : "Passwort ändern"}
      </Button>
    </form>
  );
}

/* --------------------------- Benachrichtigungen --------------------------- */

export type PreferenceMap = Record<NotificationKind, Record<NotificationChannel, boolean>>;

export function NotificationPreferencesForm({ preferences }: { preferences: PreferenceMap }) {
  const [state, formAction, pending] = useActionState(updateNotificationPreferencesAction, INITIAL_FORM_STATE);

  return (
    <form action={formAction} noValidate className="space-y-4">
      <fieldset className="space-y-1">
        <legend className="sr-only">Benachrichtigungen je Ereignis und Kanal</legend>

        <div className="hidden grid-cols-[1fr_auto_auto] gap-x-6 border-b border-line pb-2 text-xs font-bold uppercase tracking-kicker text-ink-soft sm:grid">
          <span>Ereignis</span>
          {NOTIFICATION_CHANNELS.map((channel) => (
            <span key={channel} className="w-24 text-center">
              {NOTIFICATION_CHANNEL_LABELS[channel]}
            </span>
          ))}
        </div>

        {NOTIFICATION_KINDS.map((kind) => (
          <div
            key={kind}
            className="grid gap-x-6 gap-y-1 border-b border-line py-2 last:border-b-0 sm:grid-cols-[1fr_auto_auto] sm:items-center"
          >
            <span className="text-sm font-bold text-ink">{NOTIFICATION_KIND_LABELS[kind]}</span>
            {NOTIFICATION_CHANNELS.map((channel) => {
              const id = preferenceFieldName(kind, channel);
              return (
                <Checkbox
                  key={channel}
                  id={id}
                  name={id}
                  defaultChecked={preferences[kind][channel]}
                  aria-label={`${NOTIFICATION_KIND_LABELS[kind]} – ${NOTIFICATION_CHANNEL_LABELS[channel]}`}
                  label={<span className="sm:sr-only">{NOTIFICATION_CHANNEL_LABELS[channel]}</span>}
                  className="sm:w-24 sm:justify-center sm:py-1"
                />
              );
            })}
          </div>
        ))}
      </fieldset>
      <Result state={state} />
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Wird gespeichert …" : "Einstellungen speichern"}
      </Button>
    </form>
  );
}

/* ------------------------------ Kontolöschung ----------------------------- */

export function AccountDeletionForm() {
  const [state, formAction, pending] = useActionState(requestAccountDeletionAction, INITIAL_FORM_STATE);
  const fe = state.fieldErrors ?? {};

  if (state.success) return <Banner kind="success" message={state.success} />;

  return (
    <form action={formAction} noValidate className="space-y-4">
      <FormField htmlFor="reason" label="Grund (optional)" error={fe.reason}>
        <Textarea id="reason" name="reason" rows={3} maxLength={1000} invalid={fe.reason !== undefined} />
      </FormField>
      <div>
        <Checkbox
          id="confirm"
          name="confirm"
          required
          label="Ich möchte die Löschung meines Kontos beantragen. Mir ist bewusst, dass damit mein Zugang zum Campus und meine Lerndaten unwiderruflich entfernt werden."
        />
        {fe.confirm ? (
          <p role="alert" className="text-sm text-danger">
            {fe.confirm}
          </p>
        ) : null}
      </div>
      <Result state={state} />
      <Button type="submit" variant="danger" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Wird gesendet …" : "Kontolöschung beantragen"}
      </Button>
    </form>
  );
}
