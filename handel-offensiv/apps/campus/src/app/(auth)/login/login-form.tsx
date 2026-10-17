"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Banner, Button, FormField, Input } from "@handel-offensiv/ui";

import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = { error: null };

export function LoginForm({ weiter }: { weiter?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const invalid = state.error !== null;

  return (
    <form action={formAction} noValidate className="space-y-5">
      {weiter ? <input type="hidden" name="weiter" value={weiter} /> : null}

      <FormField htmlFor="email" label="E-Mail-Adresse" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          invalid={invalid}
          placeholder="vorname.nachname@unternehmen.de"
        />
      </FormField>

      <FormField htmlFor="password" label="Passwort" required>
        <Input id="password" name="password" type="password" autoComplete="current-password" required invalid={invalid} />
      </FormField>

      {state.error ? <Banner kind="error" message={state.error} /> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Wird geprüft …" : "Anmelden"}
      </Button>

      <p className="text-center text-sm">
        <Link
          href="/login/passwort-vergessen"
          className="inline-flex min-h-touch items-center font-bold text-ink-soft underline-offset-2 hover:text-ink hover:underline"
        >
          Passwort vergessen?
        </Link>
      </p>
    </form>
  );
}
