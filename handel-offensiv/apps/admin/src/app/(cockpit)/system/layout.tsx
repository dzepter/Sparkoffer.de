import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { can } from "@handel-offensiv/domain";

import { ErrorState } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";

/**
 * SYSTEM-Bereich (§55): Benutzer & Rollen, Audit Log, Einstellungen.
 * Zugangs-Gate: ausschliesslich Super Admins (can settings.manage).
 *
 * Wie ueberall gilt: Dieses Gate ist UX. Verbindlich sind RLS bzw. die
 * erneuten can()-Pruefungen in jeder Server Action und jedem Seiten-Query –
 * die Seiten dieses Bereichs pruefen deshalb zusaetzlich selbst.
 */
export default async function SystemLayout({ children }: { children: ReactNode }) {
  const session = await getActorContext();
  if (!session) redirect("/login");

  if (!can(session.actor, "settings.manage")) {
    return (
      <ErrorState
        title="Kein Zugriff"
        message={ERROR_MESSAGES.forbidden}
      />
    );
  }

  return <>{children}</>;
}
