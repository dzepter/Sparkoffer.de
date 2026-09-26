import type { Metadata } from "next";
import Link from "next/link";

import { APP } from "@handel-offensiv/config";

import { Kicker } from "@/components/ui/kicker";

import { PasswordResetRequestForm } from "./form";

export const metadata: Metadata = { title: "Passwort vergessen" };

export default function PasswortVergessenPage() {
  return (
    <main className="pitch-lines flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Kicker>{APP.company}</Kicker>
          <h1 className="mt-2 text-3xl font-extrabold uppercase leading-tight tracking-tight text-ink">
            Passwort
            <span className="block text-green-deep">vergessen</span>
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            Geben Sie Ihre E-Mail-Adresse ein. Wenn dazu ein Konto besteht, senden wir Ihnen einen
            Link zum Zurücksetzen Ihres Passworts.
          </p>
        </div>

        <div className="rounded border border-line bg-white p-6">
          <PasswordResetRequestForm />
        </div>

        <p className="mt-6 text-center text-xs text-ink-soft">
          <Link href="/login" className="font-bold text-ink underline-offset-2 hover:underline">
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </main>
  );
}
