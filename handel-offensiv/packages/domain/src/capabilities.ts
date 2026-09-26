/**
 * §47 Rollen- und Rechte-Matrix.
 *
 * EINZIGE Stelle fuer Capability-Entscheidungen im Client-/Server-Code –
 * keine verstreuten Rollen-Ifs ausserhalb dieser Datei. Verbindlich bleibt
 * immer RLS in der Datenbank; `can()` ist ein UI-/API-Gate, kein Ersatz.
 */

import type { ActorContext, ActorMembership, MemberRole, Uuid } from '@handel-offensiv/types';

// --------------------------------------------------------------------------
// Capabilities
// --------------------------------------------------------------------------

export type Capability =
  | 'organizations.read'
  | 'organizations.manage'
  | 'users.read'
  | 'users.invite'
  | 'users.manage'
  | 'cohorts.read'
  | 'cohorts.manage'
  | 'content.read'
  | 'content.edit'
  | 'content.publish'
  | 'submissions.read'
  | 'submissions.feedback'
  | 'analytics.read'
  | 'notifications.send'
  | 'audit.read'
  | 'settings.manage';

/** Vollstaendige Liste (Reihenfolge = Anzeige-Reihenfolge in Admin-UI) */
export const ALL_CAPABILITIES: readonly Capability[] = [
  'organizations.read',
  'organizations.manage',
  'users.read',
  'users.invite',
  'users.manage',
  'cohorts.read',
  'cohorts.manage',
  'content.read',
  'content.edit',
  'content.publish',
  'submissions.read',
  'submissions.feedback',
  'analytics.read',
  'notifications.send',
  'audit.read',
  'settings.manage',
] as const;

/** Rollen der Matrix: DB-Rollen plus super_admin (profiles.is_super_admin) */
export type CapabilityRole = MemberRole | 'super_admin';

/**
 * Basis-Grants je Rolle.
 * - super_admin: alles
 * - org_admin: Lesen der eigenen Organisation, Nutzer sehen/einladen, Analytics
 * - trainer: eigene Cohorts, Inhalte lesen, Abgaben sehen + Feedback,
 *   Benachrichtigungen an die eigene Gruppe, Analytics
 * - participant: keine Admin-Capabilities
 */
export const ROLE_CAPABILITIES: Readonly<Record<CapabilityRole, readonly Capability[]>> = {
  super_admin: ALL_CAPABILITIES,
  org_admin: ['organizations.read', 'users.read', 'users.invite', 'cohorts.read', 'analytics.read'],
  trainer: [
    'cohorts.read',
    'users.read',
    'content.read',
    'submissions.read',
    'submissions.feedback',
    'notifications.send',
    'analytics.read',
  ],
  participant: [],
};

/**
 * Capabilities, die je Rolle ueber organization_memberships.permissions (jsonb)
 * ZUSAETZLICH aktivierbar sind (explizites `true`). Alles andere ist per
 * permissions nicht zuschaltbar (fail-closed).
 */
export const ROLE_OPTIONAL_CAPABILITIES: Readonly<Record<CapabilityRole, readonly Capability[]>> = {
  super_admin: [],
  org_admin: ['users.manage', 'notifications.send'],
  trainer: [],
  participant: [],
};

// --------------------------------------------------------------------------
// Scope & Kontext
// --------------------------------------------------------------------------

/** Optionaler Geltungsbereich einer Capability-Pruefung */
export interface CapabilityScope {
  organizationId?: Uuid;
  cohortId?: Uuid;
}

/** Feinsteuerung aus organization_memberships.permissions, z. B. { "users.invite": false } */
export type CapabilityPermissionOverrides = Partial<Record<Capability, boolean>>;

/** Membership inkl. optionaler permissions-Overrides */
export interface CapabilityMembership extends ActorMembership {
  permissions?: CapabilityPermissionOverrides;
}

/** ActorContext, dessen Memberships permissions tragen duerfen (abwaertskompatibel) */
export interface CapabilityActorContext extends ActorContext {
  memberships: CapabilityMembership[];
}

// --------------------------------------------------------------------------
// Zentrale Entscheidung
// --------------------------------------------------------------------------

/**
 * Prueft, ob der Akteur die Capability (im optionalen Scope) besitzt.
 *
 * Scope-Regeln:
 * - super_admin: immer erlaubt.
 * - organizationId: nur Memberships genau dieser Organisation zaehlen.
 * - cohortId: Trainer nur eigene Cohorts (trainerCohortIds), Teilnehmer nur
 *   eigene (memberCohortIds). Ein org_admin kann eine Cohort aus dem
 *   ActorContext heraus NICHT der Organisation zuordnen -> fail-closed
 *   (Aufrufer muss organizationId mitgeben).
 * - Ohne Scope: generisches Gate (z. B. Menuepunkt anzeigen).
 */
export function can(
  actor: CapabilityActorContext,
  capability: Capability,
  scope?: CapabilityScope,
): boolean {
  if (actor.isSuperAdmin) return true;

  return actor.memberships.some(
    (membership) =>
      membershipGrants(membership, capability) && membershipMatchesScope(actor, membership, scope),
  );
}

/** Alle Capabilities des Akteurs im gegebenen Scope (z. B. fuer UI-Gates) */
export function capabilitiesFor(
  actor: CapabilityActorContext,
  scope?: CapabilityScope,
): Capability[] {
  return ALL_CAPABILITIES.filter((capability) => can(actor, capability, scope));
}

// --------------------------------------------------------------------------
// intern
// --------------------------------------------------------------------------

/** Basis-Grant + permissions-Overrides: false entzieht, true schaltet nur Optionales zu */
function membershipGrants(membership: CapabilityMembership, capability: Capability): boolean {
  const override = membership.permissions?.[capability];
  if (override === false) return false;

  if (ROLE_CAPABILITIES[membership.role].includes(capability)) return true;
  return override === true && ROLE_OPTIONAL_CAPABILITIES[membership.role].includes(capability);
}

function membershipMatchesScope(
  actor: CapabilityActorContext,
  membership: CapabilityMembership,
  scope?: CapabilityScope,
): boolean {
  if (!scope) return true;

  if (scope.organizationId !== undefined && membership.organizationId !== scope.organizationId) {
    return false;
  }

  if (scope.cohortId !== undefined) {
    if (membership.role === 'trainer') return actor.trainerCohortIds.includes(scope.cohortId);
    if (membership.role === 'participant') return actor.memberCohortIds.includes(scope.cohortId);
    // org_admin: Cohort->Organisation ist hier nicht aufloesbar -> fail-closed
    return false;
  }

  return true;
}
