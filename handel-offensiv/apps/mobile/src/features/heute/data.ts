/**
 * HEUTE (§10): eine gebündelte Ladefunktion für das Dashboard.
 *
 * Lädt parallel Curriculum (Module/Phasen/Lektionen + Releases + Sessions +
 * Fortschritt), module_progress-View, Ankündigungen sowie die Kandidaten
 * offener Aufgaben (required Blöcke ohne Abgabe/Reflexion/Quiz-Abschluss)
 * und leitet daraus mit deriveDashboard (@handel-offensiv/domain) die
 * Dashboard-Daten ab. Ergebnis ist JSON-serialisierbar (Offline-Persistenz).
 */
import { useQuery } from "@tanstack/react-query";
import type {
  AnnouncementRow,
  ContentBlockRow,
  DashboardData,
  DashboardOpenTask,
  IsoDateTime,
  ModuleProgress,
  Uuid,
} from "@handel-offensiv/types";
import { deriveDashboard } from "@handel-offensiv/domain";
import { safeParseBlockConfig } from "@handel-offensiv/validation";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/auth-context";
import { loadCurriculum } from "../programm/data";

function fail(): never {
  throw new Error(
    "Der Inhalt konnte gerade nicht geladen werden. Bitte versuchen Sie es erneut.",
  );
}

export async function loadDashboard(
  profileId: Uuid,
  cohortId: Uuid,
): Promise<DashboardData> {
  // Parallel: Curriculum-Bündel + Fortschritts-View + Ankündigungen +
  // eigene Abgaben/Reflexionen/Quiz-Versuche (für offene Aufgaben)
  const [curriculum, progressViewRes, announcementsRes, submissionsRes, reflectionsRes, attemptsRes] =
    await Promise.all([
      loadCurriculum(profileId, cohortId),
      supabase
        .from("module_progress")
        .select("*")
        .eq("profile_id", profileId)
        .eq("cohort_id", cohortId),
      supabase
        .from("announcements")
        .select("*")
        .eq("cohort_id", cohortId)
        .order("published_at", { ascending: false })
        .limit(10),
      supabase
        .from("assignment_submissions")
        .select("content_block_id")
        .eq("profile_id", profileId)
        .eq("cohort_id", cohortId),
      supabase
        .from("reflection_entries")
        .select("content_block_id")
        .eq("profile_id", profileId)
        .eq("cohort_id", cohortId),
      supabase
        .from("quiz_attempts")
        .select("quiz_id, completed_at")
        .eq("profile_id", profileId)
        .eq("cohort_id", cohortId),
    ]);
  if (
    progressViewRes.error ||
    announcementsRes.error ||
    submissionsRes.error ||
    reflectionsRes.error ||
    attemptsRes.error
  ) {
    fail();
  }

  const moduleProgresses = (progressViewRes.data ?? []) as ModuleProgress[];
  const announcements = (announcementsRes.data ?? []) as AnnouncementRow[];
  const submittedBlockIds = new Set(
    ((submissionsRes.data ?? []) as { content_block_id: Uuid }[]).map(
      (r) => r.content_block_id,
    ),
  );
  const reflectedBlockIds = new Set(
    ((reflectionsRes.data ?? []) as { content_block_id: Uuid }[]).map(
      (r) => r.content_block_id,
    ),
  );
  const completedQuizIds = new Set(
    ((attemptsRes.data ?? []) as { quiz_id: Uuid; completed_at: IsoDateTime | null }[])
      .filter((r) => r.completed_at !== null)
      .map((r) => r.quiz_id),
  );

  // Offene Aufgaben: required Blöcke in freigeschalteten, nicht
  // abgeschlossenen Lektionen ohne zugehörige Bearbeitung
  const completedLessonSet = new Set(curriculum.completedLessonIds);
  const candidateLessonIds = curriculum.lessons
    .filter(
      (l) =>
        curriculum.accessByLessonId[l.id]?.released === true &&
        !completedLessonSet.has(l.id),
    )
    .map((l) => l.id);

  let openTaskCandidates: DashboardOpenTask[] = [];
  if (candidateLessonIds.length > 0) {
    const blocksRes = await supabase
      .from("content_blocks")
      .select("*")
      .in("lesson_id", candidateLessonIds)
      .eq("required", true)
      .in("block_type", ["transfer_task", "reflection", "quiz"]);
    if (blocksRes.error) fail();

    const lessonById = new Map(curriculum.lessons.map((l) => [l.id, l]));
    const blocks = (blocksRes.data ?? []) as ContentBlockRow[];

    openTaskCandidates = blocks
      .filter((b) => {
        if (b.block_type === "transfer_task") return !submittedBlockIds.has(b.id);
        if (b.block_type === "reflection") return !reflectedBlockIds.has(b.id);
        // quiz: offen, solange kein abgeschlossener Versuch existiert
        const parsed = safeParseBlockConfig("quiz", b.config);
        return parsed.success ? !completedQuizIds.has(parsed.data.quizId) : false;
      })
      .map((b) => {
        const lesson = lessonById.get(b.lesson_id);
        // Fälligkeit: fixe Fälligkeit der Transferaufgabe vor der
        // Lektions-Fälligkeit aus lesson_releases.due_at
        let dueAt: IsoDateTime | null =
          curriculum.accessByLessonId[b.lesson_id]?.dueAt ?? null;
        if (b.block_type === "transfer_task") {
          const parsed = safeParseBlockConfig("transfer_task", b.config);
          if (parsed.success && parsed.data.dueMode === "fixed" && parsed.data.dueAt !== undefined) {
            dueAt = parsed.data.dueAt;
          }
        }
        return {
          contentBlockId: b.id,
          blockType: b.block_type,
          lessonId: b.lesson_id,
          lessonTitle: lesson?.title ?? "Lektion",
          dueAt,
        };
      });
  }

  const dueAtByLessonId = new Map<Uuid, IsoDateTime>();
  for (const [lessonId, access] of Object.entries(curriculum.accessByLessonId)) {
    if (access.dueAt !== undefined) dueAtByLessonId.set(lessonId, access.dueAt);
  }

  return deriveDashboard({
    now: new Date(),
    modules: curriculum.modules,
    phases: curriculum.phases,
    lessons: curriculum.lessons,
    sessions: curriculum.sessions,
    progressRows: curriculum.progressRows,
    releasedLessonIds: new Set(
      Object.entries(curriculum.accessByLessonId)
        .filter(([, a]) => a.released)
        .map(([id]) => id),
    ),
    dueAtByLessonId,
    openTaskCandidates,
    moduleProgresses,
    announcements,
  });
}

/** Query-Hook für den HEUTE-Screen */
export function useDashboard() {
  const { session, activeCohortId } = useSession();
  const profileId = session?.user.id ?? null;
  return useQuery({
    queryKey: ["dashboard", profileId, activeCohortId],
    enabled: profileId !== null && activeCohortId !== null,
    queryFn: () => loadDashboard(profileId as Uuid, activeCohortId as Uuid),
  });
}
