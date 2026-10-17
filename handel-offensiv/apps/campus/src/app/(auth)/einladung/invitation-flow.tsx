"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Banner, Button, Checkbox, FormField, Input } from "@handel-offensiv/ui";

import type { InvitationInfo } from "@/lib/auth/invitation";

import {
  completeInvitationAction,
  validateInvitationAction,
  type CompleteInvitationState,
  type ValidateInvitationState,
} from "./actions";

const INITIAL_VALIDATE: ValidateInvitationState = { error: null, token: null, invitation: null };
const INITIAL_COMPLETE: CompleteInvitationState = { error: null };

/**
 * Zweistufiger Ablauf: Einladungscode pruefen -> Zugang einrichten.
 * Kommt der Token per Link (?token=…), hat die Seite ihn bereits serverseitig
 * geprueft und liefert `initial` mit Einladung oder Fehlermeldung.
 */
export function InvitationFlow({
  initial,
  initialToken,
}: {
  initial: ValidateInvitationState | null;
  initialToken?: string;
}) {
  const [validateState, validateFormAction, validating] = useActionState(
    validateInvitationAction,
    initial ?? INITIAL_VALIDATE,
  );
  const [completeState, completeFormAction, completing] = useActionState(completeInvitationAction, INITIAL_COMPLETE);

  if (validateState.invitation && validateState.token) {
    return (
      <InvitationForm
        token={validateState.token}
        invitation={validateState.invitation}
        state={completeState}
        formAction={completeFormAction}
        pending={completing}
      />
    );
  }

  return (
    <form action={validateFormAction} noValidate className="space-y-5">
      <p className="text-sm text-ink-soft">
        Geben Sie hier Ihren Einladungscode ein. Sie finden ihn in Ihrer Einladungs-E-Mail – oder öffnen Sie
        einfach den Link aus der E-Mail.
      </p>

      <FormField htmlFor="token" label="Einladungscode" required error={validateState.error ?? undefined}>
        <Input
          id="token"
          name="token"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          required
          defaultValue={initialToken ?? ""}
          invalid={validateState.error !== null}
        />
      </FormField>

      <Button type="submit" disabled={validating} className="w-full">
        {validating ? "Wird geprüft …" : "Einladung prüfen"}
      </Button>
    </form>
  );
}

function InvitationForm({
  token,
  invitation,
  state,
  formAction,
  pending,
}: {
  token: string;
  invitation: InvitationInfo;
  state: CompleteInvitationState;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-5">
      <input type="hidden" name="token" value={token} />

      {/* Bestaetigung: Wer wird wo eingeladen? */}
      <div className="rounded border border-line bg-paper px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">Eingeladen als</p>
        <p className="mt-1 break-all text-base font-bold text-ink">{invitation.email}</p>
        <p className="mt-0.5 text-sm text-ink-soft">
          {invitation.cohortName ? `${invitation.organizationName} · ${invitation.cohortName}` : invitation.organizationName}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField htmlFor="firstName" label="Vorname" required error={fe.firstName}>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            defaultValue={invitation.firstName ?? ""}
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
            defaultValue={invitation.lastName ?? ""}
            invalid={fe.lastName !== undefined}
          />
        </FormField>
      </div>

      <FormField
        htmlFor="password"
        label="Passwort"
        required
        error={fe.password}
        hint="Mindestens 10 Zeichen. Empfehlung: ein Satz, den nur Sie kennen."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          invalid={fe.password !== undefined}
        />
      </FormField>

      <FormField htmlFor="passwordConfirm" label="Passwort wiederholen" required error={fe.passwordConfirm}>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          invalid={fe.passwordConfirm !== undefined}
        />
      </FormField>

      <div>
        <Checkbox
          id="consentPrivacy"
          name="consentPrivacy"
          required
          aria-describedby={fe.consentPrivacy ? "consentPrivacy-fehler" : undefined}
          label={
            <>
              Ich habe die{" "}
              <Link href="/datenschutz" target="_blank" rel="noopener" className="font-bold text-navy underline underline-offset-2">
                Datenschutzerklärung
              </Link>{" "}
              gelesen und stimme der Verarbeitung meiner Daten zu.
            </>
          }
        />
        {fe.consentPrivacy ? (
          <p id="consentPrivacy-fehler" role="alert" className="text-sm text-danger">
            {fe.consentPrivacy}
          </p>
        ) : null}
      </div>

      {state.error && !state.fieldErrors ? <Banner kind="error" message={state.error} /> : null}

      <Button type="submit" variant="accent" disabled={pending} className="w-full">
        {pending ? "Wird eingerichtet …" : "Zugang einrichten"}
      </Button>

      <p className="text-center text-sm">
        <Link
          href="/einladung"
          className="inline-flex min-h-touch items-center font-bold text-ink-soft underline-offset-2 hover:text-ink hover:underline"
        >
          Anderen Einladungscode eingeben
        </Link>
      </p>
    </form>
  );
}
