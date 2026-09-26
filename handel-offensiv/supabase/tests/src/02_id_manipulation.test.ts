/**
 * Pflichttest: IDs in URLs oder Requests können keine Mandantengrenze umgehen.
 * Simuliert direkte PostgREST-Schreibzugriffe mit fremden IDs.
 */
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connect, withTx } from "./harness";
import { A, B, CB, L, QUIZ } from "./ids";

let client: Client;
beforeAll(async () => {
  client = await connect();
});
afterAll(async () => {
  await client.end();
});

const RLS_VIOLATION = /row-level security/i;

describe("Teilnehmer: Schreibzugriffe mit fremden IDs", () => {
  it("kann kein fremdes Profil ändern (0 Zeilen betroffen)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(await tx.affected("update public.profiles set first_name = 'Hacker' where id = $1", [A.p2])).toBe(0);
      expect(await tx.affected("update public.profiles set first_name = 'Hacker' where id = $1", [B.p1])).toBe(0);
    });
  });

  it("kann sich nicht selbst zum Super Admin machen oder den Status ändern (Spalten eingefroren)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(
        await tx.affected("update public.profiles set is_super_admin = true, status = 'active' where id = $1", [A.p1]),
      ).toBe(1);
      const [row] = await tx.rows<{ is_super_admin: boolean }>("select is_super_admin from public.profiles where id = $1", [A.p1]);
      expect(row?.is_super_admin).toBe(false);
    });
  });

  it("kann keine Abgabe/Reflexion/Fortschritt im Namen eines anderen Profils anlegen", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(
        await tx.attempt(
          "insert into public.assignment_submissions (content_block_id, profile_id, cohort_id, note_text) values ($1, $2, $3, 'x')",
          [CB.l01Transfer, A.p2, A.cohort],
        ),
      ).toMatch(RLS_VIOLATION);
      expect(
        await tx.attempt(
          "insert into public.reflection_entries (content_block_id, profile_id, cohort_id, body) values ($1, $2, $3, 'x')",
          [CB.l01Reflection, A.p2, A.cohort],
        ),
      ).toMatch(RLS_VIOLATION);
      expect(
        await tx.attempt(
          "insert into public.lesson_progress (lesson_id, profile_id, cohort_id, status) values ($1, $2, $3, 'completed')",
          [L.atDatetimePast, A.p2, A.cohort],
        ),
      ).toMatch(RLS_VIOLATION);
    });
  });

  it("kann keine Lerndaten in einer fremden Gruppe anlegen (Cohort-ID der Organisation B)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(
        await tx.attempt(
          "insert into public.lesson_progress (lesson_id, profile_id, cohort_id, status) values ($1, $2, $3, 'in_progress')",
          [L.immediate, A.p1, B.cohort],
        ),
      ).toMatch(RLS_VIOLATION);
      expect(
        await tx.attempt(
          "insert into public.quiz_attempts (quiz_id, profile_id, cohort_id, attempt_no) values ($1, $2, $3, 9)",
          [QUIZ.free, A.p1, B.cohort],
        ),
      ).toMatch(RLS_VIOLATION);
      expect(
        await tx.attempt(
          "insert into public.action_plans (profile_id, cohort_id, module_id) values ($1, $2, null)",
          [A.p1, B.cohort],
        ),
      ).toMatch(RLS_VIOLATION);
    });
  });

  it("kann fremde Abgaben/Reflexionen/Pläne weder ändern noch löschen", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(await tx.affected("update public.assignment_submissions set note_text = 'x' where id = $1", [A.submissionP2Private])).toBe(0);
      expect(await tx.affected("delete from public.assignment_submissions where id = $1", [A.submissionP2Private])).toBe(0);
      expect(await tx.affected("update public.reflection_entries set body = 'x' where id = $1", [A.reflectionP2Trainer])).toBe(0);
      expect(await tx.affected("delete from public.reflection_entries where id = $1", [B.reflectionTrainer])).toBe(0);
      expect(await tx.affected("update public.action_plan_items set insight = 'x' where id = $1", [A.actionPlanItemP2])).toBe(0);
      expect(await tx.affected("update public.notifications set read_at = now() where id = $1", [A.notificationP2])).toBe(0);
      expect(await tx.affected("delete from public.push_tokens where id = $1", [A.pushTokenP2])).toBe(0);
    });
  });

  it("kann eigene Lerndaten nicht in ein fremdes Profil oder eine fremde Gruppe verschieben", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      // Policy laesst das Update zu (eigene Zeile), Trigger friert die Schluessel ein
      await tx.affected("update public.assignment_submissions set profile_id = $2, cohort_id = $3 where id = $1", [
        A.submissionP1Trainer,
        A.p2,
        B.cohort,
      ]);
      await tx.actAsService();
      const [row] = await tx.rows<{ profile_id: string; cohort_id: string }>(
        "select profile_id, cohort_id from public.assignment_submissions where id = $1",
        [A.submissionP1Trainer],
      );
      expect(row).toEqual({ profile_id: A.p1, cohort_id: A.cohort });
    });
  });

  it("kann sich nicht selbst einer Gruppe, Organisation oder als Trainer zuordnen", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(
        await tx.attempt("insert into public.cohort_members (cohort_id, profile_id) values ($1, $2)", [B.cohort, A.p1]),
      ).toMatch(RLS_VIOLATION);
      expect(
        await tx.attempt("insert into public.organization_memberships (organization_id, profile_id, role) values ($1, $2, 'org_admin')", [
          B.org,
          A.p1,
        ]),
      ).toMatch(RLS_VIOLATION);
      expect(
        await tx.attempt("insert into public.cohort_trainers (cohort_id, profile_id) values ($1, $2)", [A.cohort, A.p1]),
      ).toMatch(RLS_VIOLATION);
      expect(
        await tx.attempt("insert into public.course_enrollments (profile_id, cohort_id) values ($1, $2)", [A.p1, B.cohort]),
      ).toMatch(RLS_VIOLATION);
      expect(
        await tx.attempt(
          "insert into public.lesson_releases (lesson_id, cohort_id, profile_id, release_mode) values ($1, $2, $3, 'immediate')",
          [L.atDatetimeFuture, A.cohort, A.p1],
        ),
      ).toMatch(RLS_VIOLATION);
    });
  });

  it("kann keine Freischaltregel manipulieren", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(await tx.affected("update public.lesson_releases set released_at = now() where lesson_id = $1", [L.manualLocked])).toBe(0);
      expect(await tx.affected("delete from public.lesson_releases where lesson_id = $1", [L.expired])).toBe(0);
    });
  });
});

describe("Trainer: Schreibzugriffe mit fremden IDs", () => {
  it("kann Freischaltungen der Gruppe B weder ändern noch Ankündigungen dort erstellen", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.trainer);
      expect(await tx.affected("update public.lesson_releases set released_at = now() where cohort_id = $1", [B.cohort])).toBe(0);
      expect(
        await tx.attempt(
          "insert into public.announcements (cohort_id, author_profile_id, title, body) values ($1, $2, 't', 'b')",
          [B.cohort, A.trainer],
        ),
      ).toMatch(RLS_VIOLATION);
      // Autor-Spoofing in der eigenen Gruppe
      expect(
        await tx.attempt(
          "insert into public.announcements (cohort_id, author_profile_id, title, body) values ($1, $2, 't', 'b')",
          [A.cohort, B.trainer],
        ),
      ).toMatch(RLS_VIOLATION);
    });
  });

  it("darf bei manueller Freischaltung NUR released_at setzen (übrige Spalten eingefroren)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.trainer);
      const affected = await tx.affected(
        "update public.lesson_releases set released_at = now(), release_mode = 'immediate', cohort_id = $2 where lesson_id = $1 and cohort_id = $3",
        [L.manualLocked, B.cohort, A.cohort],
      );
      expect(affected).toBe(1);
      await tx.actAsService();
      const [row] = await tx.rows<{ release_mode: string; cohort_id: string; released_at: string | null }>(
        "select release_mode, cohort_id, released_at from public.lesson_releases where lesson_id = $1",
        [L.manualLocked],
      );
      expect(row?.release_mode).toBe("manual");
      expect(row?.cohort_id).toBe(A.cohort);
      expect(row?.released_at).not.toBeNull();
    });
  });

  it("kann kein Feedback zu Abgaben der Gruppe B oder zu privaten Abgaben geben", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.trainer);
      expect(
        await tx.attempt(
          "insert into public.trainer_feedback (submission_id, author_profile_id, recipient_profile_id, body) values ($1, $2, $3, 'x')",
          [B.submissionTrainer, A.trainer, B.p1],
        ),
      ).toMatch(RLS_VIOLATION);
      expect(
        await tx.attempt(
          "insert into public.trainer_feedback (submission_id, author_profile_id, recipient_profile_id, body) values ($1, $2, $3, 'x')",
          [A.submissionP2Private, A.trainer, A.p2],
        ),
      ).toMatch(RLS_VIOLATION);
    });
  });

  it("kann keine Stammdaten schreiben (Gruppen, Mitglieder, Termine, Inhalte)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.trainer);
      expect(await tx.affected("update public.cohorts set name = 'x' where id = $1", [A.cohort])).toBe(0);
      expect(await tx.affected("update public.cohort_sessions set title = 'x' where cohort_id = $1", [A.cohort])).toBe(0);
      expect(await tx.affected("update public.lessons set title = 'x' where id = $1", [L.immediate])).toBe(0);
      expect(
        await tx.attempt("insert into public.cohort_members (cohort_id, profile_id) values ($1, $2)", [A.cohort, B.p1]),
      ).toMatch(RLS_VIOLATION);
    });
  });
});

describe("Org-Admin: Schreibzugriffe", () => {
  it("kann per Client keine Organisation, Mitgliedschaft oder Einladung ändern (nur Edge Functions/Server)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.admin);
      expect(await tx.affected("update public.organizations set name = 'x' where id = $1", [A.org])).toBe(0);
      expect(await tx.affected("update public.organization_memberships set role = 'org_admin' where organization_id = $1", [A.org])).toBe(0);
      expect(await tx.affected("update public.invitations set status = 'accepted' where id = $1", [A.invitation])).toBe(0);
      expect(await tx.affected("update public.cohorts set status = 'archived' where id = $1", [B.cohort])).toBe(0);
    });
  });
});
