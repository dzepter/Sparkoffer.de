/**
 * Datenlayer TERMINE – Port von apps/mobile/src/features/termine/screen.tsx
 * und apps/mobile/app/termin/[sessionId].tsx auf Server Components.
 *
 * REGELN:
 *  - Alle Zugriffe laufen ueber den Supabase-Client der NUTZERSITZUNG (RLS:
 *    cohort_sessions_select, session_notes_own, profiles_select).
 *  - Der Trainername wird nur angezeigt, wenn das Profil per RLS lesbar ist
 *    (Teilnehmer sehen Trainerprofile in der Regel nicht) – sonst entfaellt er.
 *  - Fehler werden nicht geworfen, sondern als `error` (deutsch) zurueckgegeben.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CohortSessionRow, ModuleRow, Uuid } from "@handel-offensiv/types";

import { ERROR_MESSAGES } from "@/lib/errors";

import { isPastSession } from "./format";

type Db = SupabaseClient;

/** Termin inkl. Modulbezug (RLS-gefiltert; Modul nur, wenn veroeffentlicht) */
export type SessionWithModule = CohortSessionRow & {
  modules: Pick<ModuleRow, "id" | "number_label" | "title" | "position" | "claim"> | null;
};

export interface SessionListData {
  /** Kommende Termine, aufsteigend (naechster zuerst) */
  upcoming: SessionWithModule[];
  /** Vergangene Termine, juengster zuerst */
  past: SessionWithModule[];
  error: string | null;
}

const SESSION_SELECT = "*, modules(id, number_label, title, position, claim)";

/** Alle Termine der aktiven Gruppe, getrennt in kommend/vergangen. */
export async function loadSessions(supabase: Db, cohortId: Uuid, now: Date = new Date()): Promise<SessionListData> {
  const { data, error } = await supabase
    .from("cohort_sessions")
    .select(SESSION_SELECT)
    .eq("cohort_id", cohortId)
    .order("starts_at", { ascending: true });
  if (error) return { upcoming: [], past: [], error: ERROR_MESSAGES.load };

  const sessions = (data as unknown as SessionWithModule[] | null) ?? [];
  return {
    upcoming: sessions.filter((s) => !isPastSession(s, now)),
    past: sessions.filter((s) => isPastSession(s, now)).reverse(),
    error: null,
  };
}

export interface SessionNote {
  note_md: string;
  updated_at: string;
}

export interface SessionDetailData {
  session: SessionWithModule | null;
  /** Trainername, falls das Profil per RLS lesbar ist – sonst null */
  trainerName: string | null;
  /** Persoenliche Notiz der angemeldeten Person (nur eigene, RLS) */
  note: SessionNote | null;
  error: string | null;
}

/** Ein Termin mit Modul, Trainername (falls lesbar) und eigener Notiz. */
export async function loadSessionDetail(supabase: Db, sessionId: Uuid, profileId: Uuid): Promise<SessionDetailData> {
  const { data, error } = await supabase.from("cohort_sessions").select(SESSION_SELECT).eq("id", sessionId).maybeSingle();
  if (error) return { session: null, trainerName: null, note: null, error: ERROR_MESSAGES.load };

  const session = (data as unknown as SessionWithModule | null) ?? null;
  if (session === null) return { session: null, trainerName: null, note: null, error: null };

  const [trainerName, note] = await Promise.all([loadTrainerName(supabase, session.trainer_profile_id), loadSessionNote(supabase, sessionId, profileId)]);

  return { session, trainerName, note, error: null };
}

/**
 * Trainername – bewusst fehlertolerant: Verwehrt RLS den Zugriff auf das
 * Profil (Regelfall fuer Teilnehmer), bleibt das Ergebnis null.
 */
async function loadTrainerName(supabase: Db, trainerProfileId: Uuid | null): Promise<string | null> {
  if (trainerProfileId === null) return null;
  const { data } = await supabase.from("profiles").select("first_name, last_name").eq("id", trainerProfileId).maybeSingle();
  const row = (data as { first_name: string | null; last_name: string | null } | null) ?? null;
  if (row === null) return null;
  const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
  return name.length > 0 ? name : null;
}

async function loadSessionNote(supabase: Db, sessionId: Uuid, profileId: Uuid): Promise<SessionNote | null> {
  const { data } = await supabase
    .from("session_notes")
    .select("note_md, updated_at")
    .eq("session_id", sessionId)
    .eq("profile_id", profileId)
    .maybeSingle();
  return (data as SessionNote | null) ?? null;
}
