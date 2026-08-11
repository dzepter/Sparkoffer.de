/**
 * Datenbeschaffung fuer die VORSCHAU ALS TEILNEHMER (§25).
 * Laedt Gruppe, Programmstruktur (nur veroeffentlichte Module/Lektionen –
 * exakt was Teilnehmer sehen), echte Releases/Sessions der Gruppe und den
 * Fortschritt des optional gewaehlten Teilnehmers. Auswertung erfolgt mit
 * isLessonReleased aus @handel-offensiv/domain.
 */

import "server-only";

import {
  isLessonReleased,
  selectRelevantRelease,
  type ReleaseDecision,
} from "@handel-offensiv/domain";
import type {
  CohortSessionRow,
  LearningPhaseRow,
  LessonReleaseRow,
  LessonRow,
  ModuleRow,
} from "@handel-offensiv/types";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Platzhalter, wenn kein Teilnehmer gewaehlt ist (matcht keine Individualregel). */
export const NO_PROFILE = "00000000-0000-0000-0000-000000000000";

export interface PreviewData {
  cohort: { id: string; name: string; organization_id: string; program_id: string };
  program: { id: string; title: string; subtitle: string | null; status: string } | null;
  /** Nur veroeffentlichte Module, in Positionsreihenfolge */
  modules: ModuleRow[];
  /** Alle Phasen der Module, in Positionsreihenfolge */
  phasesByModule: Map<string, LearningPhaseRow[]>;
  /** Nur veroeffentlichte Lektionen, in Positionsreihenfolge */
  lessonsByPhase: Map<string, LessonRow[]>;
  releases: LessonReleaseRow[];
  sessions: CohortSessionRow[];
  completedLessonIds: Set<string>;
  completedModuleIds: Set<string>;
}

export type PreviewResult =
  | { ok: true; data: PreviewData }
  | { ok: false; error: "not_found" | "load_failed" };

/** Laedt alle Vorschau-Daten fuer (Gruppe, optionaler Teilnehmer). */
export async function loadPreviewData(
  cohortId: string,
  profileId: string | null,
): Promise<PreviewResult> {
  const supabase = await createSupabaseServerClient();

  const cohortRes = await supabase
    .from("cohorts")
    .select("id, name, organization_id, program_id")
    .eq("id", cohortId)
    .maybeSingle();
  if (cohortRes.error) return { ok: false, error: "load_failed" };
  const cohort = cohortRes.data as PreviewData["cohort"] | null;
  if (cohort === null) return { ok: false, error: "not_found" };

  const [programRes, modulesRes, releasesRes, sessionsRes] = await Promise.all([
    supabase
      .from("programs")
      .select("id, title, subtitle, status")
      .eq("id", cohort.program_id)
      .maybeSingle(),
    supabase
      .from("modules")
      .select("*")
      .eq("program_id", cohort.program_id)
      .eq("status", "published")
      .order("position", { ascending: true }),
    supabase.from("lesson_releases").select("*").eq("cohort_id", cohortId),
    supabase
      .from("cohort_sessions")
      .select("*")
      .eq("cohort_id", cohortId)
      .order("starts_at", { ascending: true }),
  ]);
  if (programRes.error || modulesRes.error || releasesRes.error || sessionsRes.error) {
    return { ok: false, error: "load_failed" };
  }

  const modules = (modulesRes.data ?? []) as ModuleRow[];
  const moduleIds = modules.map((m) => m.id);

  const phasesByModule = new Map<string, LearningPhaseRow[]>();
  const lessonsByPhase = new Map<string, LessonRow[]>();

  if (moduleIds.length > 0) {
    const phasesRes = await supabase
      .from("learning_phases")
      .select("*")
      .in("module_id", moduleIds)
      .order("position", { ascending: true });
    if (phasesRes.error) return { ok: false, error: "load_failed" };
    const phases = (phasesRes.data ?? []) as LearningPhaseRow[];
    for (const phase of phases) {
      const list = phasesByModule.get(phase.module_id) ?? [];
      list.push(phase);
      phasesByModule.set(phase.module_id, list);
    }

    if (phases.length > 0) {
      const lessonsRes = await supabase
        .from("lessons")
        .select("*")
        .in(
          "learning_phase_id",
          phases.map((p) => p.id),
        )
        .eq("status", "published")
        .order("position", { ascending: true });
      if (lessonsRes.error) return { ok: false, error: "load_failed" };
      for (const lesson of (lessonsRes.data ?? []) as LessonRow[]) {
        const list = lessonsByPhase.get(lesson.learning_phase_id) ?? [];
        list.push(lesson);
        lessonsByPhase.set(lesson.learning_phase_id, list);
      }
    }
  }

  // Fortschritt des gewaehlten Teilnehmers (fuer after_lesson/after_module)
  const completedLessonIds = new Set<string>();
  if (profileId !== null) {
    const progressRes = await supabase
      .from("lesson_progress")
      .select("lesson_id, status")
      .eq("cohort_id", cohortId)
      .eq("profile_id", profileId)
      .eq("status", "completed");
    if (progressRes.error) return { ok: false, error: "load_failed" };
    for (const row of (progressRes.data ?? []) as Array<{ lesson_id: string }>) {
      completedLessonIds.add(row.lesson_id);
    }
  }

  // Modul abgeschlossen = alle veroeffentlichten Lektionen abgeschlossen (>0)
  const completedModuleIds = new Set<string>();
  for (const module of modules) {
    const phases = phasesByModule.get(module.id) ?? [];
    const lessons = phases.flatMap((phase) => lessonsByPhase.get(phase.id) ?? []);
    if (lessons.length > 0 && lessons.every((lesson) => completedLessonIds.has(lesson.id))) {
      completedModuleIds.add(module.id);
    }
  }

  return {
    ok: true,
    data: {
      cohort,
      program: (programRes.data ?? null) as PreviewData["program"],
      modules,
      phasesByModule,
      lessonsByPhase,
      releases: (releasesRes.data ?? []) as LessonReleaseRow[],
      sessions: (sessionsRes.data ?? []) as CohortSessionRow[],
      completedLessonIds,
      completedModuleIds,
    },
  };
}

/**
 * Wertet die Freischaltung einer Lektion aus Teilnehmersicht aus.
 * Ohne Regel: gesperrt (fail-closed – wie in der Teilnehmer-App).
 */
export function evaluateLessonRelease(
  data: PreviewData,
  lessonId: string,
  profileId: string | null,
): ReleaseDecision {
  const release = selectRelevantRelease(data.releases, lessonId, profileId ?? NO_PROFILE);
  if (release === undefined) {
    return {
      released: false,
      reason: "no_rule",
      lockedLabel: "Für diese Gruppe noch nicht freigeschaltet.",
    };
  }
  return isLessonReleased(release, {
    now: new Date(),
    sessions: data.sessions,
    completedLessonIds: data.completedLessonIds,
    completedModuleIds: data.completedModuleIds,
  });
}
