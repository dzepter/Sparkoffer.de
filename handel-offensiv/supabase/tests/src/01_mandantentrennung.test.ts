/**
 * Pflichttests (Freigabe 26.09.2026, Punkt 8):
 *  - Teilnehmer A kann Teilnehmer B nicht lesen
 *  - Teilnehmer A kann fremde Reflexionen nicht lesen
 *  - Trainer A kann Gruppe B nicht lesen
 *  - Org-Admin A kann Organisation B nicht lesen
 *  - Org-Admins sehen NIE Reflexionen, private Abgaben, Quizversuche
 */
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connect, withTx } from "./harness";
import { A, B, X_TRAINER_NO_MEMBERSHIP } from "./ids";

let client: Client;
beforeAll(async () => {
  client = await connect();
});
afterAll(async () => {
  await client.end();
});

describe("Teilnehmer A ↔ Teilnehmer B (gleiche Gruppe)", () => {
  it("sieht nur das eigene Profil, nicht das des anderen Teilnehmers", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const rows = await tx.rows<{ id: string }>("select id from public.profiles order by id");
      expect(rows.map((r) => r.id)).toEqual([A.p1]);
    });
  });

  it("sieht nur die eigene Gruppenzuordnung (keine Mitgliederliste)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const rows = await tx.rows<{ profile_id: string }>("select profile_id from public.cohort_members");
      expect(rows.map((r) => r.profile_id)).toEqual([A.p1]);
    });
  });

  it("sieht keine Abgaben, Fortschritte, Quizversuche, Pläne, Benachrichtigungen anderer", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const owners = async (table: string) =>
        (await tx.rows<{ profile_id: string }>(`select distinct profile_id from public.${table}`)).map(
          (r) => r.profile_id,
        );
      expect(await owners("assignment_submissions")).toEqual([A.p1]);
      expect(await owners("lesson_progress")).toEqual([A.p1]);
      expect(await owners("quiz_attempts")).toEqual([A.p1]);
      expect(await owners("action_plans")).toEqual([A.p1]);
      expect(await owners("notifications")).toEqual([A.p1]);
      expect(await owners("push_tokens")).toEqual([A.p1]);
      expect(await owners("user_consents")).toEqual([A.p1]);
      expect(await tx.count("select 1 from public.account_deletion_requests")).toBe(0);
      expect(await tx.count("select 1 from public.action_plan_items where id = $1", [A.actionPlanItemP2])).toBe(0);
    });
  });

  it("kann fremde Reflexionen nicht lesen – auch nicht trainer-sichtbare", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const rows = await tx.rows<{ id: string }>("select id from public.reflection_entries");
      expect(rows.map((r) => r.id)).toEqual([A.reflectionP1Private]);
      expect(await tx.count("select 1 from public.reflection_entries where id = $1", [A.reflectionP2Trainer])).toBe(0);
    });
  });

  it("sieht Trainer-Feedback nur als Empfänger", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p2);
      expect(await tx.count("select 1 from public.trainer_feedback")).toBe(0);
      await tx.actAs(A.p1);
      expect(await tx.count("select 1 from public.trainer_feedback")).toBe(1);
    });
  });
});

describe("Trainer A ↔ Gruppe B", () => {
  it("sieht nur die eigene Gruppe, deren Termine, Mitglieder und Ankündigungen", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.trainer);
      expect((await tx.rows<{ id: string }>("select id from public.cohorts")).map((r) => r.id)).toEqual([A.cohort]);
      expect(await tx.count("select 1 from public.cohort_sessions where cohort_id = $1", [B.cohort])).toBe(0);
      expect(await tx.count("select 1 from public.cohort_members where cohort_id = $1", [B.cohort])).toBe(0);
      expect(await tx.count("select 1 from public.announcements where id = $1", [B.announcement])).toBe(0);
      expect(await tx.count("select 1 from public.course_enrollments where cohort_id = $1", [B.cohort])).toBe(0);
      expect(await tx.count("select 1 from public.lesson_releases where cohort_id = $1", [B.cohort])).toBe(0);
    });
  });

  it("sieht keine Lerndaten der Gruppe B – auch nicht trainer-sichtbare", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.trainer);
      expect(await tx.count("select 1 from public.assignment_submissions where id = $1", [B.submissionTrainer])).toBe(0);
      expect(await tx.count("select 1 from public.reflection_entries where id = $1", [B.reflectionTrainer])).toBe(0);
      expect(await tx.count("select 1 from public.quiz_attempts where id = $1", [B.quizAttempt])).toBe(0);
      expect(await tx.count("select 1 from public.action_plans where id = $1", [B.actionPlanShared])).toBe(0);
      expect(await tx.count("select 1 from public.action_plan_items where id = $1", [B.actionPlanItem])).toBe(0);
      expect(await tx.count("select 1 from public.lesson_progress where id = $1", [B.progressL01])).toBe(0);
      expect(await tx.count("select 1 from public.profiles where id = $1", [B.p1])).toBe(0);
      expect(await tx.count("select 1 from public.organizations where id = $1", [B.org])).toBe(0);
    });
  });

  it("sieht in der eigenen Gruppe nur trainer-sichtbare Reflexionen/Abgaben und geteilte Pläne", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.trainer);
      expect((await tx.rows<{ id: string }>("select id from public.reflection_entries")).map((r) => r.id)).toEqual([
        A.reflectionP2Trainer,
      ]);
      expect((await tx.rows<{ id: string }>("select id from public.assignment_submissions")).map((r) => r.id)).toEqual([
        A.submissionP1Trainer,
      ]);
      expect((await tx.rows<{ id: string }>("select id from public.action_plans")).map((r) => r.id)).toEqual([
        A.actionPlanP2Shared,
      ]);
    });
  });

  it("Trainer mit inaktiver Mitgliedschaft in der Organisation sieht die Gruppe nicht", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(X_TRAINER_NO_MEMBERSHIP);
      expect(await tx.count("select 1 from public.cohorts")).toBe(0);
      expect(await tx.count("select 1 from public.cohort_members")).toBe(0);
      expect(await tx.count("select 1 from public.lessons")).toBe(0);
      expect(await tx.count("select 1 from public.assignment_submissions")).toBe(0);
    });
  });
});

describe("Org-Admin A ↔ Organisation B", () => {
  it("sieht ausschließlich die eigene Organisation und deren Gruppen/Mitglieder/Einladungen", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.admin);
      expect((await tx.rows<{ id: string }>("select id from public.organizations")).map((r) => r.id)).toEqual([A.org]);
      expect(await tx.count("select 1 from public.organization_memberships where organization_id = $1", [B.org])).toBe(0);
      expect(await tx.count("select 1 from public.cohorts where organization_id = $1", [B.org])).toBe(0);
      expect(await tx.count("select 1 from public.invitations where id = $1", [B.invitation])).toBe(0);
      expect(await tx.count("select 1 from public.invitations where id = $1", [A.invitation])).toBe(1);
      expect(await tx.count("select 1 from public.cohort_members where cohort_id = $1", [B.cohort])).toBe(0);
      expect(await tx.count("select 1 from public.lesson_progress where cohort_id = $1", [B.cohort])).toBe(0);
      expect(await tx.count("select 1 from public.learning_assets where id = $1", [B.asset])).toBe(0);
      expect(await tx.count("select 1 from public.learning_assets where id = $1", [A.asset])).toBe(1);
    });
  });

  it("sieht NIE Reflexionen, Abgaben, Quizversuche oder Pläne – auch nicht der eigenen Organisation", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.admin);
      expect(await tx.count("select 1 from public.reflection_entries")).toBe(0);
      expect(await tx.count("select 1 from public.assignment_submissions")).toBe(0);
      expect(await tx.count("select 1 from public.quiz_attempts")).toBe(0);
      expect(await tx.count("select 1 from public.action_plans")).toBe(0);
      expect(await tx.count("select 1 from public.trainer_feedback")).toBe(0);
      expect(await tx.count("select 1 from public.notifications")).toBe(0);
    });
  });

  it("Org-Admin B sieht nichts aus Organisation A", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(B.admin);
      expect(await tx.count("select 1 from public.organizations where id = $1", [A.org])).toBe(0);
      expect(await tx.count("select 1 from public.cohorts where id = $1", [A.cohort])).toBe(0);
      expect(await tx.count("select 1 from public.invitations where id = $1", [A.invitation])).toBe(0);
      expect(await tx.count("select 1 from public.lesson_progress where cohort_id = $1", [A.cohort])).toBe(0);
    });
  });
});

describe("Storage-Pfade", () => {
  it("Teilnehmer A sieht nur Assets der eigenen Organisation und nur den eigenen Avatar", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const rows = await tx.rows<{ name: string }>("select name from storage.objects order by name");
      expect(rows.map((r) => r.name)).toEqual([
        `${A.p1}/avatar.jpg`,
        `organizations/${A.org}/a.pdf`,
      ]);
    });
  });
});
