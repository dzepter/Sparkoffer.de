import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@handel-offensiv/ui";

import { AuthHeading } from "../../public-frame";
import { PasswordResetRequestForm } from "./form";

export const metadata: Metadata = { title: "Passwort vergessen" };

export default function PasswortVergessenPage() {
  return (
    <>
      <AuthHeading kicker="Zugang" title="Passwort vergessen">
        Geben Sie Ihre E-Mail-Adresse ein. Wenn dazu ein Konto besteht, senden wir Ihnen einen Link zum
        Zurücksetzen Ihres Passworts.
      </AuthHeading>

      <Card>
        <PasswordResetRequestForm />
      </Card>

      <p className="mt-6 text-center text-sm">
        <Link
          href="/login"
          className="inline-flex min-h-touch items-center font-bold text-navy underline-offset-2 hover:underline"
        >
          Zurück zur Anmeldung
        </Link>
      </p>
    </>
  );
}
