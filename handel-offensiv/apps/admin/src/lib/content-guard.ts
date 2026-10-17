/**
 * Gemeinsames Berechtigungs-Gate fuer die Server Actions des Bereichs
 * Programme & Inhalte. can() ist hier die Server-seitige Vorpruefung VOR
 * jeder Service-Role-Operation (Regel aus src/lib/supabase/admin.ts);
 * verbindlich bleibt zusaetzlich RLS.
 */

import "server-only";

import { can, type Capability } from "@handel-offensiv/domain";

import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";

export type GuardResult =
  | { ok: true; profileId: string }
  | { ok: false; error: string };

/** Prueft Session + Capability; liefert bei Erfolg die Profil-ID des Akteurs. */
export async function requireCapability(capability: Capability): Promise<GuardResult> {
  const session = await getActorContext();
  if (!session) return { ok: false, error: ERROR_MESSAGES.sessionExpired };
  if (!can(session.actor, capability)) return { ok: false, error: ERROR_MESSAGES.forbidden };
  return { ok: true, profileId: session.actor.profileId };
}
