import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { APP } from "@handel-offensiv/config";

import { Kicker } from "@/components/ui/kicker";
import { hasRecentRecoverySession } from "@/lib/recovery-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { NewPasswordForm } from "./form";

export const metadata: Metadata = { title: "Neues Passwort" };

export default async function PasswortNeuPage() {
  // Nur mit gueltiger Recovery-Session (Link, max. 15 Minuten alt) erreichbar –
  // ohne Sitzung neutral zum Login, mit normaler Sitzung zurueck ins Cockpit.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?hinweis=link-ungueltig");
  if (!(await hasRecentRecoverySession(supabase))) redirect("/");

  return (
    <main className="pitch-lines flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Kicker>{APP.company}</Kicker>
          <h1 className="mt-2 text-3xl font-extrabold uppercase leading-tight tracking-tight text-ink">
            Neues
            <span className="block text-green-deep">Passwort</span>
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            Wählen Sie ein neues Passwort mit mindestens 10 Zeichen. Nach dem Speichern werden Sie
            auf allen Geräten abgemeldet und melden sich neu an.
          </p>
        </div>

        <div className="rounded border border-line bg-white p-6">
          <NewPasswordForm />
        </div>
      </div>
    </main>
  );
}
