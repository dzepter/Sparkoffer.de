"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

import { setNewPasswordAction, type PasswordResetState } from "./actions";

const initialState: PasswordResetState = { error: null };

export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState(setNewPasswordAction, initialState);

  return (
    <form action={formAction} noValidate className="space-y-5">
      <FormField
        htmlFor="password"
        label="Neues Passwort"
        required
        error={state.fieldErrors?.password}
        hint="Mindestens 10 Zeichen. Empfehlung: ein Satz, den nur Sie kennen."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          invalid={state.fieldErrors?.password !== undefined}
        />
      </FormField>

      <FormField
        htmlFor="passwordConfirm"
        label="Neues Passwort wiederholen"
        required
        error={state.fieldErrors?.passwordConfirm}
      >
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          invalid={state.fieldErrors?.passwordConfirm !== undefined}
        />
      </FormField>

      {state.error && !state.fieldErrors ? (
        <p role="alert" className="rounded border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird gespeichert …" : "Passwort speichern"}
      </Button>
    </form>
  );
}
