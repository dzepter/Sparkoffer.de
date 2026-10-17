"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

import { requestPasswordResetAction, type PasswordResetRequestState } from "../actions";

const initialState: PasswordResetRequestState = { done: false, error: null };

export function PasswordResetRequestForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state.done) {
    return (
      <div role="status" className="space-y-3">
        <p className="text-sm font-bold text-ink">Bitte prüfen Sie Ihr E-Mail-Postfach.</p>
        <p className="text-sm text-ink-soft">
          Wenn zu dieser Adresse ein Konto besteht, erhalten Sie in den nächsten Minuten eine E-Mail
          mit einem Link zum Zurücksetzen. Der Link ist aus Sicherheitsgründen nur kurz gültig.
          Prüfen Sie ggf. auch Ihren Spam-Ordner.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-5">
      <FormField htmlFor="email" label="E-Mail-Adresse" required error={state.error ?? undefined}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          invalid={state.error !== null}
          placeholder="vorname.nachname@unternehmen.de"
        />
      </FormField>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird gesendet …" : "Link anfordern"}
      </Button>
    </form>
  );
}
