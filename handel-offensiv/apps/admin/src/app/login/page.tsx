import type { Metadata } from "next";

import { APP } from "@handel-offensiv/config";

import { Kicker } from "@/components/ui/kicker";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ weiter?: string }>;
}) {
  const { weiter } = await searchParams;

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
