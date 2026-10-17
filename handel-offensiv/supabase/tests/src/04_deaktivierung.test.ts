/**
 * Pflichttest: deaktivierte Accounts verlieren unmittelbar den Zugriff –
 * ohne Cron, ohne Logout, beim nächsten Request.
 */
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connect, withTx, type Tx } from "./harness";
import { A, SA } from "./ids";

let client: Client;
beforeAll(async () => {
  client = await connect();
});
afterAll(async () => {
  await client.end();
});

async function participantSnapshot(tx: Tx) {
  return {
    lessons: await tx.count("select 1 from public.lessons"),
    profile: await tx.count("select 1 from public.profiles"),
    cohorts: await tx.count("select 1 from public.cohorts"),
    submissions: await tx.count("select 1 from public.assignment_submissions"),
    reflections: await tx.count("select 1 from public.reflection_entries"),
    notifications: await tx.count("select 1 from public.notifications"),
    organizations: await tx.count("select 1 from public.organizations"),
    storage: await tx.count("select 1 from storage.objects"),
  };
}

const NOTHING = {
  lessons: 0,
  profile: 0,
  cohorts: 0,
  submissions: 0,
  reflections: 0,
  notifications: 0,
  organizations: 0,
  storage: 0,
};

describe("Deaktivierung wirkt sofort", () => {
  it("Profil inaktiv (Fixture P3): sieht nichts – auch nicht die eigenen Zeilen", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p3InactiveProfile);
      expect(await participantSnapshot(tx)).toEqual(NOTHING);
    });
  });

  it("Profil wird deaktiviert: Zugriff endet mit dem nächsten Statement", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const before = await participantSnapshot(tx);
      expect(before.lessons).toBeGreaterThan(0);
      expect(before.profile).toBe(1);

      await tx.actAsService();
      await tx.affected("update public.profiles set status = 'inactive' where id = $1", [A.p1]);

      await tx.actAs(A.p1);
      expect(await participantSnapshot(tx)).toEqual(NOTHING);
      // auch Schreibzugriffe auf eigene Zeilen sind weg
      expect(await tx.affected("update public.notifications set read_at = now() where id = $1", [A.notificationP1])).toBe(0);
    });
  });

  it("Organisationsmitgliedschaft inaktiv (Fixture P4): kein Gruppen-/Lektionszugriff mehr", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p4InactiveMembership);
      const snap = await participantSnapshot(tx);
      expect(snap.lessons).toBe(0);
      expect(snap.cohorts).toBe(0);
      expect(snap.organizations).toBe(0);
      // Profil selbst bleibt lesbar (Konto existiert, nur ohne Zugang)
      expect(snap.profile).toBe(1);
    });
  });

  it("Mitgliedschaft wird deaktiviert: Zugriff endet sofort, Reaktivierung stellt ihn wieder her", async () => {
    await withTx(client, async (tx) => {
      await tx.actAsService();
      await tx.affected("update public.organization_memberships set status = 'inactive' where profile_id = $1", [A.p1]);
      await tx.actAs(A.p1);
      expect(await tx.count("select 1 from public.lessons")).toBe(0);
      expect(await tx.count("select 1 from public.cohorts")).toBe(0);

      await tx.actAsService();
      await tx.affected("update public.organization_memberships set status = 'active' where profile_id = $1", [A.p1]);
      await tx.actAs(A.p1);
      expect(await tx.count("select 1 from public.lessons")).toBeGreaterThan(0);
    });
  });

  it("Gruppe archiviert oder Organisation inaktiv: Teilnehmer verlieren den Zugriff", async () => {
    await withTx(client, async (tx) => {
      await tx.actAsService();
      await tx.affected("update public.cohorts set status = 'archived' where id = $1", [A.cohort]);
      await tx.actAs(A.p1);
      expect(await tx.count("select 1 from public.lessons")).toBe(0);
      expect(await tx.count("select 1 from public.cohorts")).toBe(0);
    });
    await withTx(client, async (tx) => {
      await tx.actAsService();
      await tx.affected("update public.organizations set status = 'inactive' where id = $1", [A.org]);
      await tx.actAs(A.p1);
      expect(await tx.count("select 1 from public.lessons")).toBe(0);
      expect(await tx.count("select 1 from public.organizations")).toBe(0);
      await tx.actAs(A.admin);
      expect(await tx.count("select 1 from public.organizations")).toBe(0);
      expect(await tx.count("select 1 from public.cohorts")).toBe(0);
    });
  });

  it("Trainer deaktiviert (Profil oder Mitgliedschaft): keine Gruppe, keine Lerndaten mehr", async () => {
    await withTx(client, async (tx) => {
      await tx.actAsService();
      await tx.affected("update public.profiles set status = 'inactive' where id = $1", [A.trainer]);
      await tx.actAs(A.trainer);
      expect(await tx.count("select 1 from public.cohorts")).toBe(0);
      expect(await tx.count("select 1 from public.assignment_submissions")).toBe(0);
      expect(await tx.count("select 1 from public.reflection_entries")).toBe(0);
      expect(await tx.count("select 1 from public.lessons")).toBe(0);
      expect(await tx.count("select 1 from public.profiles")).toBe(0);
    });
    await withTx(client, async (tx) => {
      await tx.actAsService();
      await tx.affected("update public.organization_memberships set status = 'inactive' where profile_id = $1", [A.trainer]);
      await tx.actAs(A.trainer);
      expect(await tx.count("select 1 from public.cohorts")).toBe(0);
      expect(await tx.count("select 1 from public.assignment_submissions")).toBe(0);
      expect(await tx.count("select 1 from public.cohort_members")).toBe(0);
      expect(await tx.affected("update public.lesson_releases set released_at = now() where cohort_id = $1", [A.cohort])).toBe(0);
    });
  });

  it("Org-Admin deaktiviert: keine Organisation, keine Einladungen mehr", async () => {
    await withTx(client, async (tx) => {
      await tx.actAsService();
      await tx.affected("update public.organization_memberships set status = 'inactive' where profile_id = $1", [A.admin]);
      await tx.actAs(A.admin);
      expect(await tx.count("select 1 from public.organizations")).toBe(0);
      expect(await tx.count("select 1 from public.invitations")).toBe(0);
      expect(await tx.count("select 1 from public.organization_memberships where organization_id = $1", [A.org])).toBe(1); // nur eigene Zeile
    });
  });

  it("Super Admin deaktiviert: verliert den globalen Zugriff", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(SA);
      expect(await tx.count("select 1 from public.organizations")).toBe(2);
      await tx.actAsService();
      await tx.affected("update public.profiles set status = 'inactive' where id = $1", [SA]);
      await tx.actAs(SA);
      expect(await tx.count("select 1 from public.organizations")).toBe(0);
      expect(await tx.count("select 1 from public.lessons")).toBe(0);
      expect(await tx.count("select 1 from public.profiles")).toBe(0);
    });
  });
});
