/**
 * Pflichttest: gesperrte Lektionen sind auch über direkte API-Abfragen nicht
 * lesbar. Die Freischaltung wird in der DB bei jedem Zugriff ausgewertet
 * (app.lesson_is_released) – ohne Cron-Abhängigkeit.
 */
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connect, withTx, type Tx } from "./harness";
import { A, B, CB, L, P1_LOCKED_LESSONS, P1_VISIBLE_LESSONS, QUIZ, SA } from "./ids";

let client: Client;
beforeAll(async () => {
  client = await connect();
});
afterAll(async () => {
  await client.end();
});

const RLS_VIOLATION = /row-level security/i;

describe("Lektionen: Sichtbarkeit je Freischaltmodus (Teilnehmer P1, Gruppe A1)", () => {
  it("liefert genau die freigeschalteten Lektionen", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      const rows = await tx.rows<{ id: string }>("select id from public.lessons order by id");
      expect(rows.map((r) => r.id).sort()).toEqual([...P1_VISIBLE_LESSONS].sort());
    });
  });

  it.each(P1_LOCKED_LESSONS)("gesperrte Lektion %s ist per Direktabfrage nicht lesbar", async (lessonId) => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(await tx.count("select 1 from public.lessons where id = $1", [lessonId])).toBe(0);
      expect(await tx.count("select 1 from public.content_blocks where lesson_id = $1", [lessonId])).toBe(0);
    });
  });

  it("Inhalte und Quiz einer gesperrten Lektion sind unsichtbar, die einer freien sichtbar", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(await tx.count("select 1 from public.content_blocks where id = $1", [CB.l03Text])).toBe(0);
      expect(await tx.count("select 1 from public.quizzes where id = $1", [QUIZ.locked])).toBe(0);
      expect(await tx.count("select 1 from public.quiz_questions where quiz_id = $1", [QUIZ.locked])).toBe(0);
      expect(await tx.count("select 1 from public.quiz_options where question_id = 'ff000000-0000-4000-a000-000000000021'")).toBe(0);
      expect(await tx.count("select 1 from public.content_blocks where id = $1", [CB.l01Text])).toBe(1);
      expect(await tx.count("select 1 from public.quizzes where id = $1", [QUIZ.free])).toBe(1);
    });
  });

  it("Voraussetzungen wirken personenbezogen: P2 (L01 nicht abgeschlossen) sieht L06/L07 nicht, P1 schon", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p2);
      expect(await tx.count("select 1 from public.lessons where id = $1", [L.afterLesson])).toBe(0);
      expect(await tx.count("select 1 from public.lessons where id = $1", [L.afterModule])).toBe(0);
      expect(await tx.count("select 1 from public.lessons where id = $1", [L.profileOverride])).toBe(0);
      await tx.actAs(A.p1);
      expect(await tx.count("select 1 from public.lessons where id = $1", [L.afterLesson])).toBe(1);
      expect(await tx.count("select 1 from public.lessons where id = $1", [L.afterModule])).toBe(1);
      expect(await tx.count("select 1 from public.lessons where id = $1", [L.profileOverride])).toBe(1);
    });
  });

  it("Freischaltung ist gruppengebunden: L17 nur für Gruppe B sichtbar", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(B.p1);
      expect(await tx.count("select 1 from public.lessons where id = $1", [L.onlyB])).toBe(1);
      expect(await tx.count("select 1 from public.content_blocks where id = $1", [CB.l17Text])).toBe(1);
      // B1 hat keine Regel fuer L02 -> gesperrt, obwohl fuer A1 frei
      expect(await tx.count("select 1 from public.lessons where id = $1", [L.atDatetimePast])).toBe(0);
    });
  });

  it("Abschluss der Voraussetzung schaltet SOFORT frei (ohne Cron)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p2);
      expect(await tx.count("select 1 from public.lessons where id = $1", [L.afterLesson])).toBe(0);
      await tx.affected("update public.lesson_progress set status = 'completed', completed_at = now() where id = $1", [
        A.progressP2L01,
      ]);
      expect(await tx.count("select 1 from public.lessons where id = $1", [L.afterLesson])).toBe(1);
    });
  });

  it("manuelle Freigabe durch den Trainer wirkt sofort", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(await tx.count("select 1 from public.lessons where id = $1", [L.manualLocked])).toBe(0);
      await tx.actAs(A.trainer);
      expect(
        await tx.affected("update public.lesson_releases set released_at = now() where lesson_id = $1 and cohort_id = $2", [
          L.manualLocked,
          A.cohort,
        ]),
      ).toBe(1);
      await tx.actAs(A.p1);
      expect(await tx.count("select 1 from public.lessons where id = $1", [L.manualLocked])).toBe(1);
    });
  });

  it("Änderung der Freischaltzeit wirkt sofort (Service-Rolle, z. B. Admin-Cockpit)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAsService();
      await tx.affected("update public.lesson_releases set release_at = now() - interval '1 minute' where lesson_id = $1", [
        L.atDatetimeFuture,
      ]);
      await tx.actAs(A.p1);
      expect(await tx.count("select 1 from public.lessons where id = $1", [L.atDatetimeFuture])).toBe(1);
      await tx.actAsService();
      await tx.affected("update public.lesson_releases set expires_at = now() - interval '1 second' where lesson_id = $1", [
        L.atDatetimeFuture,
      ]);
      await tx.actAs(A.p1);
      expect(await tx.count("select 1 from public.lessons where id = $1", [L.atDatetimeFuture])).toBe(0);
    });
  });
});

describe("Schreibzugriffe auf gesperrte Inhalte", () => {
  it("kein Fortschritt, keine Abgabe, keine Reflexion, kein Quizversuch für gesperrte Lektionen", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p1);
      expect(
        await tx.attempt(
          "insert into public.lesson_progress (lesson_id, profile_id, cohort_id, status) values ($1, $2, $3, 'completed')",
          [L.atDatetimeFuture, A.p1, A.cohort],
        ),
      ).toMatch(RLS_VIOLATION);
      expect(
        await tx.attempt(
          "insert into public.assignment_submissions (content_block_id, profile_id, cohort_id, note_text) values ($1, $2, $3, 'x')",
          [CB.l03Text, A.p1, A.cohort],
        ),
      ).toMatch(RLS_VIOLATION);
      expect(
        await tx.attempt(
          "insert into public.reflection_entries (content_block_id, profile_id, cohort_id, body) values ($1, $2, $3, 'x')",
          [CB.l03Text, A.p1, A.cohort],
        ),
      ).toMatch(RLS_VIOLATION);
      expect(
        await tx.attempt(
          "insert into public.quiz_attempts (quiz_id, profile_id, cohort_id, attempt_no) values ($1, $2, $3, 2)",
          [QUIZ.locked, A.p1, A.cohort],
        ),
      ).toMatch(RLS_VIOLATION);
      // Positivkontrolle: freie Lektion
      expect(
        await tx.attempt(
          "insert into public.lesson_progress (lesson_id, profile_id, cohort_id, status) values ($1, $2, $3, 'in_progress')",
          [L.atDatetimePast, A.p1, A.cohort],
        ),
      ).toBeNull();
    });
  });
});

describe("app.lesson_is_released – Zeitfenster (halboffen, Spiegel von release-engine.ts)", () => {
  const released = async (tx: Tx, at: string) => {
    const [row] = await tx.rows<{ ok: boolean }>("select app.lesson_is_released($1, $2, $3::timestamptz) as ok", [
      L.window2027,
      A.p1,
      at,
    ]);
    return row?.ok;
  };

  it("frei genau ab release_at, gesperrt genau ab expires_at", async () => {
    await withTx(client, async (tx) => {
      await tx.actAsService();
      expect(await released(tx, "2027-03-12T08:59:59+01:00")).toBe(false);
      expect(await released(tx, "2027-03-12T09:00:00+01:00")).toBe(true);
      expect(await released(tx, "2027-03-31T23:59:59+02:00")).toBe(true);
      expect(await released(tx, "2027-04-01T00:00:00+02:00")).toBe(false);
      // heute (Testlauf 2026) noch gesperrt
      expect(await released(tx, new Date().toISOString())).toBe(false);
    });
  });

  it("Session-Offsets rechnen in 24-Stunden-Schritten (wie das TypeScript-Modul)", async () => {
    await withTx(client, async (tx) => {
      await tx.actAsService();
      const [s] = await tx.rows<{ starts_at: Date }>("select starts_at from public.cohort_sessions where id = $1", [A.sessionFuture]);
      const startsAt = s!.starts_at.getTime();
      const at = (ms: number) => new Date(ms).toISOString();
      const check = async (lesson: string, when: string) =>
        (await tx.rows<{ ok: boolean }>("select app.lesson_is_released($1, $2, $3::timestamptz) as ok", [lesson, A.p1, when]))[0]?.ok;
      // L04: 1 Tag vor Termin
      expect(await check(L.beforeSessionLocked, at(startsAt - 24 * 3600_000 - 1000))).toBe(false);
      expect(await check(L.beforeSessionLocked, at(startsAt - 24 * 3600_000))).toBe(true);
      // L15: 0 Tage nach Termin
      expect(await check(L.afterSessionLocked, at(startsAt - 1000))).toBe(false);
      expect(await check(L.afterSessionLocked, at(startsAt))).toBe(true);
    });
  });

  it("verweigert ohne Einschreibung, in archivierter Gruppe und für fremde Profile", async () => {
    await withTx(client, async (tx) => {
      await tx.actAsService();
      const check = async (lesson: string, profile: string) =>
        (await tx.rows<{ ok: boolean }>("select app.lesson_is_released($1, $2) as ok", [lesson, profile]))[0]?.ok;
      expect(await check(L.immediate, A.p1)).toBe(true);
      expect(await check(L.immediate, A.p5NoEnrollment)).toBe(false);
      expect(await check(L.immediate, A.p6ArchivedCohort)).toBe(false);
      expect(await check(L.immediate, A.p4InactiveMembership)).toBe(false);
      expect(await check(L.immediate, A.p3InactiveProfile)).toBe(false);
      expect(await check(L.onlyB, A.p1)).toBe(false);
      expect(await check(L.immediate, "00000000-0000-4000-a000-0000000000ff")).toBe(false);
    });
  });
});

describe("Positivkontrollen", () => {
  it("Super Admin sieht alle Lektionen inkl. Entwürfe; Trainer A sieht alle Lektionen des Programms", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(SA);
      expect(await tx.count("select 1 from public.lessons")).toBe(18);
      await tx.actAs(A.trainer);
      // Trainer: alle veroeffentlichten Lektionen des Programms (17), Entwurf nicht
      expect(await tx.count("select 1 from public.lessons")).toBe(17);
      expect(await tx.count("select 1 from public.lessons where id = $1", [L.draft])).toBe(0);
    });
  });

  it("Teilnehmer ohne Einschreibung und in archivierter Gruppe sehen keine Lektionen", async () => {
    await withTx(client, async (tx) => {
      await tx.actAs(A.p5NoEnrollment);
      expect(await tx.count("select 1 from public.lessons")).toBe(0);
      await tx.actAs(A.p6ArchivedCohort);
      expect(await tx.count("select 1 from public.lessons")).toBe(0);
      expect(await tx.count("select 1 from public.cohorts")).toBe(0);
    });
  });
});
