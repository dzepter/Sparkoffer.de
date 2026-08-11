"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = { error: null };

export function LoginForm({ weiter }: { weiter?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} noValidate className="space-y-5">
      {weiter ? <input type="hidden" name="weiter" value={weiter} /> : null}

      <FormField htmlFor="email" label="E-Mail-Adresse" required>
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

      <FormField htmlFor="password" label="Passwort" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          invalid={state.error !== null}
        />
      </FormField>

      {state.error ? (
        <p role="alert" className="rounded border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird geprüft …" : "Anmelden"}
      </Button>
    </form>
  );
}
