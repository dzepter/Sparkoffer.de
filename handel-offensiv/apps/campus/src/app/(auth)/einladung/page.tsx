import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@handel-offensiv/ui";

import { invitationRateLimitOk, validateInvitation } from "@/lib/auth/invitation";
import { ERROR_MESSAGES } from "@/lib/errors";

import { AuthHeading } from "../public-frame";
import type { ValidateInvitationState } from "./actions";
import { InvitationFlow } from "./invitation-flow";

export const metadata: Metadata = { title: "Einladung annehmen" };

/**
 * Einladung annehmen – einziger Registrierungsweg (kein Self-Signup).
 * Token aus dem Link (?token=…) wird sofort serverseitig geprueft – auch
 * dieser GET-Aufruf zaehlt gegen das Rate Limit je Besucher-IP.
 */
export default async function EinladungPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const linkToken = typeof token === "string" ? token.trim() : "";

  let initial: ValidateInvitationState | null = null;
  if (linkToken.length > 0) {
    if (!(await invitationRateLimitOk())) {
      initial = { error: ERROR_MESSAGES.rateLimited, token: null, invitation: null };
    } else {
      const result = await validateInvitation(linkToken);
      initial = result.ok
        ? { error: null, token: linkToken, invitation: result.invitation }
        : { error: result.error, token: null, invitation: null };
    }
  }

  const showForm = initial?.invitation !== null && initial?.invitation !== undefined;

  return (
    <>
      <AuthHeading kicker="Einladung" title={showForm ? "Zugang einrichten" : "Einladung annehmen"}>
        {showForm
          ? "Bitte prüfen Sie Ihren Namen und wählen Sie ein Passwort. Danach sind Sie im Campus angemeldet."
          : "Sie haben eine Einladung zum Programm erhalten? Hier richten Sie Ihren persönlichen Zugang ein."}
      </AuthHeading>

      <Card>
        <InvitationFlow initial={initial} initialToken={linkToken.length > 0 ? linkToken : undefined} />
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
