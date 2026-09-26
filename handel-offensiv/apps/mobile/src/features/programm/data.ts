/**
 * Curriculum-Datenlayer (PROGRAMM, Modul-Detail, Lektion).
 *
 * Lädt Module -> Lernphasen -> Lektionen des Cohort-Programms plus
 * Freischaltungsregeln, Termine und Lernfortschritt und wertet die
 * Release-Engine (@handel-offensiv/domain) je Lektion aus.
 *
 * WICHTIG: Das Query-Ergebnis wird via AsyncStorage persistiert (Offline §34)
 * und muss deshalb JSON-serialisierbar sein – keine Maps/Sets/Dates im
 * Rückgabewert, nur Arrays/Records/ISO-Strings.
 */
import { useQuery } from "@tanstack/react-query";
import type {
  CohortSessionRow,
  LearningPhaseRow,
  LessonProgressRow,
  LessonReleaseRow,
  LessonRow,
  ModuleRow,
  Uuid,
} from "@handel-offensiv/types";
import {
  isLessonReleased,
  selectRelevantRelease,
} from "@handel-offensiv/domain";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/auth-context";

/** Serialisierbarer Freischaltungszustand einer Lektion */
export interface LessonAccess {
  released: boolean;
  /** Deutscher Sperrtext ("Wird nach … freigeschaltet.") */
  lockedLabel?: string;
  /** Bekannter Freischaltzeitpunkt (ISO), falls berechenbar */
  availableAt?: string;
  /** Fälligkeit aus lesson_releases.due_at (ISO) */
  dueAt?: string;
}

export interface Curriculum {
  /** Nur published, sortiert nach position */
  modules: ModuleRow[];
  /** Sortiert: Modul-Reihenfolge, dann position */
  phases: LearningPhaseRow[];
  /** Nur published, sortiert: Phasen-Reihenfolge, dann position */
  lessons: LessonRow[];
  sessions: CohortSessionRow[];
  releases: LessonReleaseRow[];
  progressRows: LessonProgressRow[];
  /** Freischaltungszustand je Lektions-ID */
  accessByLessonId: Record<Uuid, LessonAccess>;
  completedLessonIds: Uuid[];
  /** Module, deren published Lektionen vollständig abgeschlossen sind */
  completedModuleIds: Uuid[];
}

/** Nested-Select-Form von supabase-js */
interface ModuleWithNested extends ModuleRow {
  learning_phases: (LearningPhaseRow & { lessons: LessonRow[] })[];
}

function fail(): never {
  // Verständliche deutsche Meldung – niemals technische Codes (§34)
  throw new Error(
    "Der Inhalt konnte gerade nicht geladen werden. Bitte versuchen Sie es erneut.",
  );
}

export async function loadCurriculum(
  profileId: Uuid,
  cohortId: Uuid,
): Promise<Curriculum> {
  // 1) Programm der Cohort ermitteln
  const cohortRes = await supabase
    .from("cohorts")
    .select("program_id")
    .eq("id", cohortId)
    .maybeSingle();
  if (cohortRes.error || cohortRes.data === null) fail();
  const programId = (cohortRes.data as { program_id: Uuid }).program_id;

  // 2) Curriculum + Kontextdaten parallel laden
  const [modulesRes, sessionsRes, releasesRes, progressRes] = await Promise.all([
    supabase
      .from("modules")
      .select("*, learning_phases(*, lessons(*))")
      .eq("program_id", programId)
      .eq("status", "published")
      .order("position"),
    supabase
      .from("cohort_sessions")
      .select("*")
      .eq("cohort_id", cohortId)
      .order("starts_at"),
    supabase.from("lesson_releases").select("*").eq("cohort_id", cohortId),
    supabase
      .from("lesson_progress")
      .select("*")
      .eq("cohort_id", cohortId)
      .eq("profile_id", profileId),
  ]);
  if (modulesRes.error || sessionsRes.error || releasesRes.error || progressRes.error) {
    fail();
  }

  const nested = (modulesRes.data ?? []) as unknown as ModuleWithNested[];
  const modules: ModuleRow[] = nested
    .map(({ learning_phases: _p, ...m }) => m as ModuleRow)
    .sort((a, b) => a.position - b.position);

  const phases: LearningPhaseRow[] = [];
  const lessons: LessonRow[] = [];
  for (const m of [...nested].sort((a, b) => a.position - b.position)) {
    const sortedPhases = [...m.learning_phases].sort((a, b) => a.position - b.position);
    for (const p of sortedPhases) {
      const { lessons: phaseLessons, ...phase } = p;
      phases.push(phase as LearningPhaseRow);
      const published = phaseLessons
        .filter((l) => l.status === "published")
        .sort((a, b) => a.position - b.position);
      lessons.push(...published);
    }
  }

  const sessions = (sessionsRes.data ?? []) as CohortSessionRow[];
  const releases = (releasesRes.data ?? []) as LessonReleaseRow[];
  const progressRows = (progressRes.data ?? []) as LessonProgressRow[];

  const completedLessonIds = progressRows
    .filter((r) => r.status === "completed")
    .map((r) => r.lesson_id);
  const completedLessonSet = new Set(completedLessonIds);

  // Modul gilt als abgeschlossen, wenn alle seine published Lektionen
  // abgeschlossen sind (und es mindestens eine gibt)
  const phaseModule = new Map(phases.map((p) => [p.id, p.module_id]));
  const lessonsByModule = new Map<Uuid, LessonRow[]>();
  for (const l of lessons) {
    const moduleId = phaseModule.get(l.learning_phase_id);
    if (moduleId === undefined) continue;
    const list = lessonsByModule.get(moduleId) ?? [];
    list.push(l);
    lessonsByModule.set(moduleId, list);
  }
  const completedModuleIds = modules
    .filter((m) => {
      const ls = lessonsByModule.get(m.id) ?? [];
      return ls.length > 0 && ls.every((l) => completedLessonSet.has(l.id));
    })
    .map((m) => m.id);

  // 3) Release-Engine je Lektion auswerten
  const ctx = {
    now: new Date(),
    sessions,
    completedLessonIds: completedLessonSet,
    completedModuleIds: new Set(completedModuleIds),
  };
  const accessByLessonId: Record<Uuid, LessonAccess> = {};
  for (const l of lessons) {
    const release = selectRelevantRelease(releases, l.id, profileId);
    if (release === undefined) {
      // Ohne Regel bleibt eine Lektion gesperrt (konservativ, §9)
      accessByLessonId[l.id] = {
        released: false,
        lockedLabel: "Diese Lektion ist noch nicht freigeschaltet.",
      };
      continue;
    }
    const decision = isLessonReleased(release, ctx);
    const access: LessonAccess = { released: decision.released };
    if (decision.lockedLabel !== undefined) access.lockedLabel = decision.lockedLabel;
    if (decision.availableAt !== undefined) {
      access.availableAt = decision.availableAt.toISOString();
    }
    if (release.due_at !== null) access.dueAt = release.due_at;
    accessByLessonId[l.id] = access;
  }

  return {
    modules,
    phases,
    lessons,
    sessions,
    releases,
    progressRows,
    accessByLessonId,
    completedLessonIds,
    completedModuleIds,
  };
}

/** Query-Hook: Curriculum der aktiven Cohort des angemeldeten Profils */
export function useCurriculum() {
  const { session, activeCohortId } = useSession();
  const profileId = session?.user.id ?? null;
  return useQuery({
    queryKey: ["curriculum", profileId, activeCohortId],
    enabled: profileId !== null && activeCohortId !== null,
    queryFn: () => loadCurriculum(profileId as Uuid, activeCohortId as Uuid),
  });
}

/* ----------------------- Ableitungen für Screens ----------------------- */

export type ModuleStatus = "completed" | "current" | "locked";

export interface ModuleJourneyItem {
  module: ModuleRow;
  status: ModuleStatus;
  /** Abgeschlossene / gesamte published Lektionen */
  completed: number;
  total: number;
  /** Sperrtext des Moduls (erste gesperrte Lektion), falls locked */
  lockedLabel?: string;
}

/**
 * Status je Modul für die Entwicklungsreise (§12):
 * completed = alle Lektionen erledigt, locked = keine Lektion freigeschaltet,
 * current = alles dazwischen (mind. eine freie, nicht alle erledigt).
 */
export function deriveModuleJourney(curriculum: Curriculum): ModuleJourneyItem[] {
  const phaseModule = new Map(curriculum.phases.map((p) => [p.id, p.module_id]));
  const completedSet = new Set(curriculum.completedLessonIds);

  return curriculum.modules.map((module) => {
    const moduleLessons = curriculum.lessons.filter(
      (l) => phaseModule.get(l.learning_phase_id) === module.id,
    );
    const total = moduleLessons.length;
    const completed = moduleLessons.filter((l) => completedSet.has(l.id)).length;
    const anyReleased = moduleLessons.some(
      (l) => curriculum.accessByLessonId[l.id]?.released === true,
    );

    if (total > 0 && completed === total) {
      return { module, status: "completed" as const, completed, total };
    }
    if (anyReleased) {
      return { module, status: "current" as const, completed, total };
    }
    const firstLocked = moduleLessons.find(
      (l) => curriculum.accessByLessonId[l.id]?.released === false,
    );
    const lockedLabel =
      (firstLocked !== undefined
        ? curriculum.accessByLessonId[firstLocked.id]?.lockedLabel
        : undefined) ?? "Wird später freigeschaltet.";
    return { module, status: "locked" as const, completed, total, lockedLabel };
  });
}
