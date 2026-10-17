import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card } from "@handel-offensiv/ui";

import { hasRecentRecoverySession } from "@/lib/auth/recovery";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { AuthHeading } from "../public-frame";
import { NewPasswordForm } from "./form";

export const metadata: Metadata = { title: "Neues Passwort" };

export default async function PasswortNeuPage() {
  // Nur mit gueltiger Recovery-Session (Link, max. 15 Minuten alt) erreichbar –
  // ohne Sitzung neutral zum Login, mit normaler Sitzung zum Profil
  // (dort wird das aktuelle Passwort verlangt).
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?hinweis=link-ungueltig");
  if (!(await hasRecentRecoverySession(supabase))) redirect("/profil");

  return (
    <>
      <AuthHeading kicker="Zugang" title="Neues Passwort">
        Wählen Sie ein neues Passwort mit mindestens 10 Zeichen. Nach dem Speichern werden Sie auf allen Geräten
        abgemeldet und melden sich neu an.
      </AuthHeading>

      <Card>
        <NewPasswordForm />
      </Card>
    </>
  );
}
