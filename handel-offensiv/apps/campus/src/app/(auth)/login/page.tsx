import type { Metadata } from "next";
import Link from "next/link";

import { APP } from "@handel-offensiv/config";
import { Banner, Card } from "@handel-offensiv/ui";

import { loginHinweis } from "@/lib/auth/hinweise";
import { safeRelativePath } from "@/lib/auth/redirect";

import { AuthHeading } from "../public-frame";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ weiter?: string; hinweis?: string }>;
}) {
  const { weiter, hinweis } = await searchParams;
  const hint = loginHinweis(hinweis);
  const target = safeRelativePath(weiter, "/heute");

  return (
    <>
      <AuthHeading kicker="Willkommen im Mannschaftsraum" title="Anmelden">
        {APP.claim} Bitte melden Sie sich mit Ihren Zugangsdaten an.
      </AuthHeading>

      {hint ? <Banner kind={hint.kind} message={hint.text} className="mb-4" /> : null}

      <Card>
        <LoginForm weiter={target === "/heute" ? undefined : target} />
      </Card>

      <div className="mt-6 space-y-2 text-center text-sm text-ink-soft">
        <p>
          Einladung erhalten?{" "}
          <Link
            href="/einladung"
            className="inline-flex min-h-touch items-center font-bold text-navy underline-offset-2 hover:underline"
          >
            Zugang einrichten
          </Link>
        </p>
        <p className="text-xs">Zugang nur auf Einladung. Bei Fragen: {APP.supportEmail}</p>
      </div>
    </>
  );
}
