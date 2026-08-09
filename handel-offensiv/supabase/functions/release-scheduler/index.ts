/**
 * Edge Function: release-scheduler (Cron)
 *
 * EINRICHTUNG (siehe auch README): stuendlich per pg_cron + pg_net aufrufen
 * (Supabase Scheduled Functions), Header "x-cron-secret: <CRON_SECRET>".
 * Ein taeglicher Lauf genuegt fuer reine Datums-Regeln; stuendlich haelt
 * at_datetime-Freischaltungen mit Uhrzeit puenktlich.
 *
 * Aufgaben (sparsam + idempotent, Dedupe ueber EXISTENZ einer notifications-
 * Zeile gleicher Art (kind) + deep_link je Profil – keine Hilfstabelle):
 *   1) Lernimpuls-Freischaltungen: lesson_releases mit Zeitregeln
 *      (at_datetime, days_after_session, days_before_session), deren
 *      Freischaltzeitpunkt JETZT liegt (Rueckschau-Fenster 48 h) ->
 *      Push + In-App: "Ihr neuer Lernimpuls ist verfügbar."
 *   2) Session-Erinnerung: Praesenztermine in 2–3 Tagen ->
 *      "Noch 3 Tage bis zu Ihrem nächsten Offensivtag."
 *   3) Faelligkeits-Erinnerung: lesson_releases mit due_at in den naechsten
 *      24 h, nur an Mitglieder, die die Lektion noch nicht abgeschlossen haben.
 */

import { supabaseAdmin, type AdminClient } from "../_shared/supabaseAdmin.ts";
import { writeAudit } from "../_shared/audit.ts";
import { fail, json, toErrorResponse } from "../_shared/errors.ts";
import { sendPushToProfiles } from "../_shared/push.ts";

const LOOKBACK_MS = 48 * 3600_000;
const HOUR_MS = 3600_000;

type NotificationKind = "release" | "session_reminder" | "task_due";

/** Nur Cron/Backend darf aufrufen: CRON_SECRET-Header oder Service-Role-Bearer. */
function requireCronAuth(req: Request): void {
  const secret = Deno.env.get("CRON_SECRET");
  if (secret && req.headers.get("x-cron-secret") === secret) return;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && req.headers.get("authorization") === `Bearer ${serviceKey}`) return;

  fail(401, "Nicht autorisiert.");
}

function formatBerlin(iso: string, timezone = "Europe/Berlin"): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(iso));
}

/** Aktive Mitglieder je Cohort, mit Cache ueber den Lauf. */
async function membersOf(
  admin: AdminClient,
  cache: Map<string, string[]>,
  cohortId: string,
): Promise<string[]> {
  const cached = cache.get(cohortId);
  if (cached) return cached;
  const { data, error } = await admin
    .from("cohort_members")
    .select("profile_id")
    .eq("cohort_id", cohortId)
    .eq("status", "active");
  if (error) {
    console.error("cohort_members konnten nicht geladen werden:", error);
    cache.set(cohortId, []);
    return [];
  }
  const ids = (data ?? []).map((r) => r.profile_id as string);
  cache.set(cohortId, ids);
  return ids;
}

/**
 * Benachrichtigt eine Zielgruppe genau EINMAL (Dedupe: existiert bereits eine
 * notifications-Zeile mit gleichem kind + deep_link fuer das Profil, wird es
 * uebersprungen). Schreibt In-App-Zeilen und versendet Push nur an Neue.
 */
async function notifyOnce(
  admin: AdminClient,
  profileIds: string[],
  kind: NotificationKind,
  title: string,
  body: string,
  deepLink: string,
): Promise<number> {
  if (profileIds.length === 0) return 0;

  const { data: existing, error: existingError } = await admin
    .from("notifications")
    .select("profile_id")
    .eq("kind", kind)
    .eq("deep_link", deepLink)
    .in("profile_id", profileIds);
  if (existingError) {
    console.error("Dedupe-Prüfung fehlgeschlagen, Gruppe wird übersprungen:", existingError);
    return 0; // lieber auslassen als doppelt benachrichtigen
  }

  const alreadyNotified = new Set((existing ?? []).map((r) => r.profile_id as string));
  const fresh = profileIds.filter((id) => !alreadyNotified.has(id));
  if (fresh.length === 0) return 0;

  const { error: insertError } = await admin.from("notifications").insert(
    fresh.map((profileId) => ({
      profile_id: profileId,
      kind,
      title,
      body,
      deep_link: deepLink,
    })),
  );
  if (insertError) {
    console.error("notifications konnten nicht geschrieben werden:", insertError);
    return 0;
  }

  await sendPushToProfiles(admin, fresh, { title, body, deepLink });
  return fresh.length;
}

Deno.serve(async (req) => {
  try {
    requireCronAuth(req);

    const admin = supabaseAdmin();
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const memberCache = new Map<string, string[]>();

    let releaseNotified = 0;
    let sessionNotified = 0;
    let dueNotified = 0;

    // ------------------------------------------------------------------
    // 1) Lernimpuls-Freischaltungen (Zeitregeln)
    // ------------------------------------------------------------------
    const { data: releases, error: releasesError } = await admin
      .from("lesson_releases")
      .select(
        "id, lesson_id, cohort_id, profile_id, release_mode, release_at, offset_days, session_id, due_at, " +
          "lessons!inner ( id, title, status )",
      )
      .in("release_mode", ["at_datetime", "days_after_session", "days_before_session"])
      .eq("lessons.status", "published");
    if (releasesError) {
      console.error("lesson_releases konnten nicht geladen werden:", releasesError);
      fail(500, "Die Freischaltungen konnten nicht geladen werden.");
    }

    // Sessions fuer session-relative Modi in einem Rutsch laden
    const sessionIds = [
      ...new Set(
        (releases ?? [])
          .map((r) => r.session_id as string | null)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const sessionStartById = new Map<string, string>();
    if (sessionIds.length > 0) {
      const { data: sessions, error } = await admin
        .from("cohort_sessions")
        .select("id, starts_at")
        .in("id", sessionIds);
      if (error) {
        console.error("cohort_sessions konnten nicht geladen werden:", error);
      }
      for (const s of sessions ?? []) {
        sessionStartById.set(s.id as string, s.starts_at as string);
      }
    }

    for (const release of releases ?? []) {
      // Effektiven Freischaltzeitpunkt bestimmen (Logik gespiegelt aus
      // @handel-offensiv/domain release-engine.ts)
      let effectiveMs: number | null = null;
      if (release.release_mode === "at_datetime" && release.release_at) {
        effectiveMs = new Date(release.release_at as string).getTime();
      } else if (release.session_id && typeof release.offset_days === "number") {
        const startsAt = sessionStartById.get(release.session_id as string);
        if (startsAt) {
          const offsetMs = (release.offset_days as number) * 24 * HOUR_MS;
          effectiveMs =
            new Date(startsAt).getTime() +
            (release.release_mode === "days_after_session" ? offsetMs : -offsetMs);
        }
      }
      if (effectiveMs === null) continue;
      // Fenster: gerade freigeschaltet (Rueckschau 48 h; Dedupe verhindert
      // Doppelversand bei ueberlappenden Laeufen)
      if (effectiveMs > now || effectiveMs < now - LOOKBACK_MS) continue;

      const lesson = release.lessons as unknown as { title: string };
      const targets = release.profile_id
        ? [release.profile_id as string]
        : await membersOf(admin, memberCache, release.cohort_id as string);

      releaseNotified += await notifyOnce(
        admin,
        targets,
        "release",
        "Ihr neuer Lernimpuls ist verfügbar.",
        `„${lesson.title}“ ist jetzt für Sie freigeschaltet.`,
        `/lektionen/${release.lesson_id}?cohort=${release.cohort_id}`,
      );
    }

    // ------------------------------------------------------------------
    // 2) Session-Erinnerung: Termine in 2–3 Tagen ("Noch 3 Tage ...")
    // ------------------------------------------------------------------
    const { data: sessions, error: sessionsError } = await admin
      .from("cohort_sessions")
      .select("id, cohort_id, title, starts_at, timezone")
      .gte("starts_at", new Date(now + 48 * HOUR_MS).toISOString())
      .lte("starts_at", new Date(now + 72 * HOUR_MS).toISOString());
    if (sessionsError) {
      console.error("Anstehende Sessions konnten nicht geladen werden:", sessionsError);
    }

    for (const session of sessions ?? []) {
      const targets = await membersOf(admin, memberCache, session.cohort_id as string);
      sessionNotified += await notifyOnce(
        admin,
        targets,
        "session_reminder",
        "Noch 3 Tage bis zu Ihrem nächsten Offensivtag.",
        `${session.title} – ${formatBerlin(session.starts_at as string, (session.timezone as string) || "Europe/Berlin")}.`,
        `/termine/${session.id}`,
      );
    }

    // ------------------------------------------------------------------
    // 3) Faelligkeits-Erinnerung: due_at in den naechsten 24 h,
    //    nur an Personen ohne abgeschlossene Lektion
    // ------------------------------------------------------------------
    const { data: dueReleases, error: dueError } = await admin
      .from("lesson_releases")
      .select("id, lesson_id, cohort_id, profile_id, due_at, lessons!inner ( id, title, status )")
      .not("due_at", "is", null)
      .gte("due_at", nowIso)
      .lte("due_at", new Date(now + 24 * HOUR_MS).toISOString())
      .eq("lessons.status", "published");
    if (dueError) {
      console.error("Fällige Freischaltungen konnten nicht geladen werden:", dueError);
    }

    for (const release of dueReleases ?? []) {
      const lesson = release.lessons as unknown as { title: string };
      const baseTargets = release.profile_id
        ? [release.profile_id as string]
        : await membersOf(admin, memberCache, release.cohort_id as string);
      if (baseTargets.length === 0) continue;

      // Wer die Lektion abgeschlossen hat, braucht keine Erinnerung.
      const { data: completedRows, error: completedError } = await admin
        .from("lesson_progress")
        .select("profile_id")
        .eq("lesson_id", release.lesson_id as string)
        .eq("cohort_id", release.cohort_id as string)
        .eq("status", "completed")
        .in("profile_id", baseTargets);
      if (completedError) {
        console.error("lesson_progress konnte nicht geladen werden:", completedError);
        continue;
      }
      const completed = new Set((completedRows ?? []).map((r) => r.profile_id as string));
      const targets = baseTargets.filter((id) => !completed.has(id));

      dueNotified += await notifyOnce(
        admin,
        targets,
        "task_due",
        "Erinnerung: Ihre Aufgabe ist bald fällig.",
        `„${lesson.title}“ ist bis ${formatBerlin(release.due_at as string)} zu erledigen.`,
        `/lektionen/${release.lesson_id}?cohort=${release.cohort_id}&faellig=1`,
      );
    }

    // Audit nur, wenn tatsaechlich etwas passiert ist (sparsam).
    if (releaseNotified + sessionNotified + dueNotified > 0) {
      await writeAudit(admin, {
        actorProfileId: null,
        action: "scheduler.notifications_sent",
        targetType: "scheduler",
        metadata: {
          release_notified: releaseNotified,
          session_reminders: sessionNotified,
          due_reminders: dueNotified,
        },
      });
    }

    return json(200, {
      releaseNotified,
      sessionReminders: sessionNotified,
      dueReminders: dueNotified,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
});
