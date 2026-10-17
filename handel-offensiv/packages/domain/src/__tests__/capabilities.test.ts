import { describe, expect, it } from 'vitest';
import {
  ALL_CAPABILITIES,
  can,
  capabilitiesFor,
  ROLE_CAPABILITIES,
} from '../capabilities';
import { makeActor } from './factories';

const ORG = 'org-1';
const OTHER_ORG = 'org-2';
const COHORT = 'cohort-1';
const OTHER_COHORT = 'cohort-2';

describe('can – super_admin', () => {
  const superAdmin = makeActor({ isSuperAdmin: true });

  it.each(ALL_CAPABILITIES)('hat %s', (capability) => {
    expect(can(superAdmin, capability)).toBe(true);
  });

  it('hat alle Capabilities auch mit beliebigem Scope', () => {
    expect(can(superAdmin, 'settings.manage', { organizationId: OTHER_ORG })).toBe(true);
    expect(can(superAdmin, 'submissions.read', { cohortId: OTHER_COHORT })).toBe(true);
    expect(capabilitiesFor(superAdmin)).toEqual([...ALL_CAPABILITIES]);
  });
});

describe('can – participant', () => {
  const participant = makeActor({
    memberships: [{ organizationId: ORG, role: 'participant' }],
    memberCohortIds: [COHORT],
  });

  it.each(ALL_CAPABILITIES)('hat NICHT %s', (capability) => {
    expect(can(participant, capability)).toBe(false);
  });

  it('hat auch in eigener Organisation/Cohort keine Admin-Capabilities', () => {
    expect(can(participant, 'cohorts.read', { organizationId: ORG })).toBe(false);
    expect(can(participant, 'submissions.read', { cohortId: COHORT })).toBe(false);
    expect(capabilitiesFor(participant)).toEqual([]);
  });
});

describe('can – org_admin', () => {
  const orgAdmin = makeActor({
    memberships: [{ organizationId: ORG, role: 'org_admin' }],
  });

  it('kann in der eigenen Organisation lesen und einladen', () => {
    expect(can(orgAdmin, 'organizations.read', { organizationId: ORG })).toBe(true);
    expect(can(orgAdmin, 'users.read', { organizationId: ORG })).toBe(true);
    expect(can(orgAdmin, 'users.invite', { organizationId: ORG })).toBe(true);
    expect(can(orgAdmin, 'cohorts.read', { organizationId: ORG })).toBe(true);
    expect(can(orgAdmin, 'analytics.read', { organizationId: ORG })).toBe(true);
  });

  it('kann NICHT settings.manage', () => {
    expect(can(orgAdmin, 'settings.manage')).toBe(false);
    expect(can(orgAdmin, 'settings.manage', { organizationId: ORG })).toBe(false);
  });

  it('kann keine fremde Organisation', () => {
    expect(can(orgAdmin, 'organizations.read', { organizationId: OTHER_ORG })).toBe(false);
    expect(can(orgAdmin, 'users.invite', { organizationId: OTHER_ORG })).toBe(false);
  });

  it('kann weder Inhalte bearbeiten noch Audit lesen', () => {
    expect(can(orgAdmin, 'content.edit')).toBe(false);
    expect(can(orgAdmin, 'content.publish')).toBe(false);
    expect(can(orgAdmin, 'audit.read')).toBe(false);
    expect(can(orgAdmin, 'organizations.manage')).toBe(false);
  });

  it('cohortId-Scope ist fuer org_admin nicht aufloesbar -> fail-closed', () => {
    expect(can(orgAdmin, 'cohorts.read', { cohortId: COHORT })).toBe(false);
  });

  it('permissions-jsonb kann users.invite entziehen', () => {
    const restricted = makeActor({
      memberships: [
        { organizationId: ORG, role: 'org_admin', permissions: { 'users.invite': false } },
      ],
    });
    expect(can(restricted, 'users.invite', { organizationId: ORG })).toBe(false);
    expect(can(restricted, 'users.read', { organizationId: ORG })).toBe(true);
  });

  it('permissions-jsonb kann nur optionale Capabilities zuschalten', () => {
    const extended = makeActor({
      memberships: [
        {
          organizationId: ORG,
          role: 'org_admin',
          permissions: { 'users.manage': true, 'settings.manage': true },
        },
      ],
    });
    expect(can(extended, 'users.manage', { organizationId: ORG })).toBe(true);
    // settings.manage ist nicht optional zuschaltbar -> bleibt verboten
    expect(can(extended, 'settings.manage', { organizationId: ORG })).toBe(false);
  });
});

describe('can – trainer', () => {
  const trainer = makeActor({
    memberships: [{ organizationId: ORG, role: 'trainer' }],
    trainerCohortIds: [COHORT],
  });

  it('kann eigene Cohort: Abgaben lesen, Feedback geben, benachrichtigen', () => {
    expect(can(trainer, 'submissions.read', { cohortId: COHORT })).toBe(true);
    expect(can(trainer, 'submissions.feedback', { cohortId: COHORT })).toBe(true);
    expect(can(trainer, 'notifications.send', { cohortId: COHORT })).toBe(true);
    expect(can(trainer, 'users.read', { cohortId: COHORT })).toBe(true);
    expect(can(trainer, 'cohorts.read', { cohortId: COHORT })).toBe(true);
  });

  it('kann NICHT in fremder Cohort', () => {
    expect(can(trainer, 'submissions.read', { cohortId: OTHER_COHORT })).toBe(false);
    expect(can(trainer, 'submissions.feedback', { cohortId: OTHER_COHORT })).toBe(false);
    expect(can(trainer, 'notifications.send', { cohortId: OTHER_COHORT })).toBe(false);
  });

  it('kann keine Inhalte bearbeiten/publizieren und keine Nutzerverwaltung', () => {
    expect(can(trainer, 'content.edit')).toBe(false);
    expect(can(trainer, 'content.publish')).toBe(false);
    expect(can(trainer, 'users.manage')).toBe(false);
    expect(can(trainer, 'settings.manage')).toBe(false);
  });

  it('Organisation-Scope: nur eigene Organisation', () => {
    expect(can(trainer, 'content.read', { organizationId: ORG })).toBe(true);
    expect(can(trainer, 'content.read', { organizationId: OTHER_ORG })).toBe(false);
  });

  it('ohne Scope gilt das generische Gate (z. B. Menuepunkt)', () => {
    expect(can(trainer, 'submissions.read')).toBe(true);
    expect(can(trainer, 'analytics.read')).toBe(true);
  });
});

describe('Matrix-Konsistenz', () => {
  it('participant hat keine Basis-Grants', () => {
    expect(ROLE_CAPABILITIES.participant).toEqual([]);
  });

  it('super_admin-Grants decken alle Capabilities ab', () => {
    expect([...ROLE_CAPABILITIES.super_admin].sort()).toEqual([...ALL_CAPABILITIES].sort());
  });
});
