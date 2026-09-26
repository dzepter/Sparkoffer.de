"use client";

import { useActionState } from "react";

import { Banner, Button, FormField, Input } from "@handel-offensiv/ui";

import { setNewPasswordAction, type PasswordResetState } from "./actions";

const initialState: PasswordResetState = { error: null };

export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState(setNewPasswordAction, initialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-5">
      <FormField
        htmlFor="password"
        label="Neues Passwort"
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

      <FormField htmlFor="passwordConfirm" label="Neues Passwort wiederholen" required error={fe.passwordConfirm}>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          invalid={fe.passwordConfirm !== undefined}
        />
      </FormField>

      {state.error && !state.fieldErrors ? <Banner kind="error" message={state.error} /> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird gespeichert …" : "Passwort speichern"}
      </Button>
    </form>
  );
}
