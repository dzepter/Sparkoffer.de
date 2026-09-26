/**
 * Anonyme Aufrufer sehen nichts; audit_logs sind für Client-Rollen gesperrt;
 * Sicherheitsfunktionen sind fail-closed bei fehlenden Claims.
 */
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connect, withTx } from "./harness";
import { A } from "./ids";

let client: Client;
beforeAll(async () => {
  client = await connect();
});
afterAll(async () => {
  await client.end();
});

const TABLES = [
  "profiles",
  "organizations",
  "organization_memberships",
  "programs",
  "modules",
  "learning_phases",
  "lessons",
  "content_blocks",
  "cohorts",
  "cohort_trainers",
  "cohort_members",
  "cohort_sessions",
  "course_enrollments",
  "lesson_releases",
  "assignment_submissions",
  "reflection_entries",
  "quizzes",
  "quiz_questions",
  "quiz_options",
  "quiz_attempts",
  "lesson_progress",
  "action_plans",
  "action_plan_items",
  "trainer_feedback",
  "announcements",
  "notifications",
  "push_tokens",
  "invitations",
  "learning_assets",
  "user_consents",
  "account_deletion_requests",
];

describe("anon", () => {
  it.each(TABLES)("liest keine Zeile aus %s", async (table) => {
    await withTx(client, async (tx) => {
      await tx.actAsAnon();
      expect(await tx.count(`select 1 from public.${table}`)).toBe(0);
    });
  });

  it("kann nichts schreiben", async () => {
    await withTx(client, async (tx) => {
      await tx.actAsAnon();
      expect(
        await tx.attempt("insert into public.notifications (profile_id, kind, title) values ($1, 'release', 'x')", [A.p1]),
      ).toMatch(/row-level security|permission denied/i);
      expect(await tx.affected("update public.profiles set first_name = 'x'")).toBe(0);
    });
  });

  it("sieht keine Storage-Objekte", async () => {
    await withTx(client, async (tx) => {
      await tx.actAsAnon();
      expect(await tx.count("select 1 from storage.objects")).toBe(0);
    });
  });
});

describe("audit_logs", () => {
  it("sind für authenticated weder lesbar noch schreibbar", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.admin);
      expect(await tx.attempt("select 1 from public.audit_logs")).toMatch(/permission denied/i);
      expect(
        await tx.attempt("insert into public.audit_logs (action) values ('x')"),
      ).toMatch(/permission denied|row-level security/i);
    });
  });
});

describe("Hilfsfunktionen sind fail-closed ohne sub-Claim", () => {
  it("anon hat keinen Zugriff auf das Schema app", async () => {
    await withTx(client, async (tx) => {
      await tx.actAsAnon();
      expect(await tx.attempt("select app.current_profile_id()")).toMatch(/permission denied for schema app/i);
    });
  });

  it("authenticated ohne sub: current_profile_id() null, is_super_admin() false, lesson_is_released() false, keine Zeilen", async () => {
    await withTx(client, async (tx) => {
      await tx.actAsAuthenticatedWithoutSub();
      expect(await tx.count("select 1 from public.lessons")).toBe(0);
      expect(await tx.count("select 1 from public.profiles")).toBe(0);
      const [row] = await tx.rows<{ pid: string | null; sa: boolean; rel: boolean }>(
        "select app.current_profile_id() as pid, app.is_super_admin() as sa, app.lesson_is_released('dd000000-0000-4000-a000-000000000001', app.current_profile_id()) as rel",
      );
      expect(row).toEqual({ pid: null, sa: false, rel: false });
    });
  });
});
