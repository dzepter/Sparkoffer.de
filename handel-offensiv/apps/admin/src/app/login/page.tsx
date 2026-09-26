import type { Metadata } from "next";

import { APP } from "@handel-offensiv/config";

import { Kicker } from "@/components/ui/kicker";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Anmelden" };

const HINWEISE: Record<string, string> = {
  "passwort-gesetzt": "Ihr neues Passwort wurde gespeichert. Bitte melden Sie sich damit an.",
  "link-ungueltig":
    "Dieser Link ist nicht mehr gültig. Bitte fordern Sie über „Passwort vergessen?“ einen neuen an.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ weiter?: string; hinweis?: string }>;
}) {
  const { weiter, hinweis } = await searchParams;
  const hinweisText = hinweis !== undefined ? HINWEISE[hinweis] : undefined;

  return (
    <main className="pitch-lines flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Kicker>{APP.company}</Kicker>
          <h1 className="mt-2 text-3xl font-extrabold uppercase leading-tight tracking-tight text-ink">
            {APP.name}
            <span className="block text-green-deep">Cockpit</span>
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            Bitte melden Sie sich mit Ihren Zugangsdaten an.
          </p>
        </div>

        {hinweisText ? (
          <p role="status" className="mb-4 rounded border border-line bg-white px-3 py-2.5 text-sm text-ink">
            {hinweisText}
          </p>
        ) : null}

        <div className="rounded border border-line bg-white p-6">
          <LoginForm weiter={weiter} />
        </div>

        <p className="mt-6 text-center text-xs text-ink-soft">
          Zugang nur auf Einladung. Bei Fragen: {APP.supportEmail}
        </p>
      </div>
    </main>
  );
}
