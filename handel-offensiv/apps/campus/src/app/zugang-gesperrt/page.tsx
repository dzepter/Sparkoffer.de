import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { APP } from "@handel-offensiv/config";
import { Button, EmptyState } from "@handel-offensiv/ui";

import { AuthHeading, PublicFrame } from "@/app/(auth)/public-frame";
import { getCampusSessionState } from "@/lib/session";

export const metadata: Metadata = { title: "Zugang nicht aktiv" };

/**
 * Neutrale Sperrseite: Auth-Sitzung vorhanden, aber kein aktives Profil
 * (deaktiviert oder Profilzeile fehlt). Liegt bewusst AUSSERHALB der
 * (campus)-Gruppe – deren Layout verlangt eine aktive Sitzung und wuerde
 * hierher zurueckleiten. Kein Urteil, keine technischen Details.
 */
export default async function ZugangGesperrtPage() {
  const state = await getCampusSessionState();
  if (state.status === "anonymous") redirect("/login");
  if (state.status === "active") redirect("/heute");

  return (
    <PublicFrame>
      <AuthHeading kicker="Zugang" title="Ihr Zugang ist derzeit nicht aktiv">
        Ihre Anmeldung war erfolgreich, aber Ihr Zugang zum Campus ist zurzeit nicht freigeschaltet.
      </AuthHeading>

      <EmptyState
        title="Bitte wenden Sie sich an Ihre Ansprechperson"
        description={`Ihre Organisation oder ${APP.company} kann den Zugang wieder aktivieren. Bei Fragen erreichen Sie uns unter ${APP.supportEmail}.`}
        action={
          <form action="/logout" method="post">
            <input type="hidden" name="hinweis" value="konto-gesperrt" />
            <Button type="submit" variant="secondary">
              Abmelden
            </Button>
          </form>
        }
      />
    </PublicFrame>
  );
}
