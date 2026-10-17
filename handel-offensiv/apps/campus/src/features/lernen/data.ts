/**
 * Datenlayer des Lernkerns (HEUTE, PROGRAMM, LEKTION) – Port der Logik aus
 * apps/mobile/src/features/{heute,programm,lesson} auf Server Components.
 *
 * REGELN:
 *  - Alle Zugriffe laufen ueber den Supabase-Client der NUTZERSITZUNG (RLS).
 *  - Freischaltung entscheidet die DATENBANK (app.lesson_is_released in der
 *    lessons-RLS): gesperrte Lektionen fehlen im Ergebnis. Die Release-Engine
 *    aus @handel-offensiv/domain dient hier NUR der Anzeige ("Wird am …
 *    freigeschaltet") fuer die Regelzeilen (lesson_releases), die Teilnehmer
 *    lesen duerfen, deren Lektion aber (noch) unsichtbar ist.
 *  - Fehler werden als deutsche Meldungen geworfen (Error Boundary der Route).
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createExternalVideoProvider,
  createSupabaseStorageVideoProvider,
  createVideoProviderRegistry,
  deriveDashboard,
  isLessonReleased,
  selectRelevantRelease,
  type PlaybackSource,
  type VideoRef,
} from "@handel-offensiv/domain";
import type {
  AnnouncementRow,
  AssignmentSubmissionRow,
  CohortSessionRow,
  ContentBlockRow,
  DashboardData,
  DashboardOpenTask,
  IsoDateTime,
  JsonObject,
  LearningPhaseRow,
  LessonProgressRow,
  LessonReleaseRow,
  LessonRow,
  ModuleProgress,
  ModuleRow,
  ProgramRow,
  QuizAttemptRow,
  QuizQuestionRow,
  QuizRow,
  ReflectionEntryRow,
  Uuid,
} from "@handel-offensiv/types";
import { safeParseBlockConfig } from "@handel-offensiv/validation";

import { ERROR_MESSAGES } from "@/lib/errors";

import { isInteractiveBlock } from "./complete";
import { createSignedUrl, SIGNED_URL_TTL_SECONDS, signUrlAdapter } from "./storage";
import { PARTICIPANT_UPLOADS_BUCKET } from "./upload-path";

type Db = SupabaseClient;

function fail(): never {
  throw new Error(ERROR_MESSAGES.load);
}

/* ------------------------------------------------------------------------ */
/* Curriculum                                                                */
/* ------------------------------------------------------------------------ */

/** Anzeige-Zustand einer Lektion */
export interface LessonAccess {
  released: boolean;
  /** Deutscher Sperrtext ("Wird am … freigeschaltet.") */
  lockedLabel?: string;
  /** Bekannter Freischaltzeitpunkt (ISO), falls berechenbar */
  availableAt?: string;
  /** Faelligkeit aus lesson_releases.due_at (ISO) */
  dueAt?: string;
}

/** Gesperrte Lektion: nur ueber die Regelzeile bekannt (Titel unsichtbar) */
export interface LockedLesson {
  lessonId: Uuid;
  lockedLabel: string;
  availableAt?: string;
  /** Modul, falls ueber den Praesenztermin der Regel ableitbar */
  moduleId: Uuid | null;
}

export interface Curriculum {
  program: Pick<ProgramRow, "id" | "title" | "subtitle"> | null;
  /** Nur published, sortiert nach position */
  modules: ModuleRow[];
  /** Sortiert: Modul-Reihenfolge, dann position */
  phases: LearningPhaseRow[];
  /** Sichtbare (= freigeschaltete) published Lektionen in Curriculum-Reihenfolge */
  lessons: LessonRow[];
  sessions: CohortSessionRow[];
  releases: LessonReleaseRow[];
  progressRows: LessonProgressRow[];
  /** Anzeige-Zustand je Lektions-ID (sichtbare UND gesperrte Lektionen) */
  accessByLessonId: Record<Uuid, LessonAccess>;
  /** Regelzeilen ohne sichtbare Lektion = gesperrte Lektionen */
  lockedLessons: LockedLesson[];
  completedLessonIds: Uuid[];
  /** Module, deren sichtbare Lektionen vollstaendig abgeschlossen sind */
  completedModuleIds: Uuid[];
}

interface ModuleWithNested extends ModuleRow {
  learning_phases: (LearningPhaseRow & { lessons: LessonRow[] })[];
}

export async function loadCurriculum(supabase: Db, profileId: Uuid, cohortId: Uuid): Promise<Curriculum> {
  const cohortRes = await supabase.from("cohorts").select("program_id").eq("id", cohortId).maybeSingle();
  if (cohortRes.error || cohortRes.data === null) fail();
  const programId = (cohortRes.data as { program_id: Uuid }).program_id;

  const [programRes, modulesRes, sessionsRes, releasesRes, progressRes] = await Promise.all([
    supabase.from("programs").select("id, title, subtitle").eq("id", programId).maybeSingle(),
    supabase
      .from("modules")
      .select("*, learning_phases(*, lessons(*))")
      .eq("program_id", programId)
      .eq("status", "published")
      .order("position"),
    supabase.from("cohort_sessions").select("*").eq("cohort_id", cohortId).order("starts_at"),
    supabase.from("lesson_releases").select("*").eq("cohort_id", cohortId),
    supabase.from("lesson_progress").select("*").eq("cohort_id", cohortId).eq("profile_id", profileId),
  ]);
  if (modulesRes.error || sessionsRes.error || releasesRes.error || progressRes.error) fail();

  const program = (programRes.data as Curriculum["program"] | null) ?? null;
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
      lessons.push(...phaseLessons.filter((l) => l.status === "published").sort((a, b) => a.position - b.position));
    }
  }

  const sessions = (sessionsRes.data ?? []) as CohortSessionRow[];
  const releases = (releasesRes.data ?? []) as LessonReleaseRow[];
  const progressRows = (progressRes.data ?? []) as LessonProgressRow[];

  const completedLessonIds = progressRows.filter((r) => r.status === "completed").map((r) => r.lesson_id);
  const completedLessonSet = new Set(completedLessonIds);

  // Modul gilt als abgeschlossen, wenn alle sichtbaren Lektionen abgeschlossen
  // sind (und es mindestens eine gibt) – Spiegel der View module_progress.
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

  // Anzeige-Zustand: sichtbare Lektion = von der DB freigeschaltet.
  const ctx = {
    now: new Date(),
    sessions,
    completedLessonIds: completedLessonSet,
    completedModuleIds: new Set(completedModuleIds),
  };
  const accessByLessonId: Record<Uuid, LessonAccess> = {};
  const visibleIds = new Set(lessons.map((l) => l.id));
  for (const l of lessons) {
    const release = selectRelevantRelease(releases, l.id, profileId);
    const access: LessonAccess = { released: true };
    if (release !== undefined && release.due_at !== null) access.dueAt = release.due_at;
    accessByLessonId[l.id] = access;
  }

  // Gesperrte Lektionen: Regelzeile vorhanden, Lektion (noch) unsichtbar.
  const sessionModule = new Map(sessions.map((s) => [s.id, s.module_id]));
  const lockedLessons: LockedLesson[] = [];
  const seenLocked = new Set<Uuid>();
  for (const r of releases) {
    if (visibleIds.has(r.lesson_id) || seenLocked.has(r.lesson_id)) continue;
    const release = selectRelevantRelease(releases, r.lesson_id, profileId);
    if (release === undefined) continue;
    seenLocked.add(r.lesson_id);
    const decision = isLessonReleased(release, ctx);
    // Regel erfuellt, Lektion trotzdem unsichtbar: dann verbirgt die DB sie
    // aus einem anderen Grund (Lektion/Modul/Programm nicht veroeffentlicht,
    // Einschreibung) – das ist keine Sperre und darf weder angezeigt noch als
    // "gesperrt" gezaehlt werden (sonst wird ein Modul nie "Abgeschlossen").
    if (decision.released) continue;
    const lockedLabel = decision.lockedLabel ?? "Diese Lektion ist noch nicht freigeschaltet.";
    const locked: LockedLesson = {
      lessonId: r.lesson_id,
      lockedLabel,
      moduleId: release.session_id !== null ? (sessionModule.get(release.session_id) ?? null) : null,
    };
    const access: LessonAccess = { released: false, lockedLabel };
    if (decision.availableAt !== undefined) {
      locked.availableAt = decision.availableAt.toISOString();
      access.availableAt = locked.availableAt;
    }
    if (release.due_at !== null) access.dueAt = release.due_at;
    accessByLessonId[r.lesson_id] = access;
    lockedLessons.push(locked);
  }

  return {
    program,
    modules,
    phases,
    lessons,
    sessions,
    releases,
    progressRows,
    accessByLessonId,
    lockedLessons,
    completedLessonIds,
    completedModuleIds,
  };
}

/* ---------------------- Ableitungen fuer PROGRAMM ----------------------- */

export type ModuleStatus = "completed" | "current" | "locked";

export interface ModuleJourneyItem {
  module: ModuleRow;
  status: ModuleStatus;
  completed: number;
  total: number;
  /** Sperrtext (falls locked) */
  lockedLabel?: string;
  /** Anzahl gesperrter Lektionen, die diesem Modul zuzuordnen sind */
  lockedCount: number;
}

/**
 * Status je Modul (§12/§15): ABGESCHLOSSEN = alle sichtbaren Lektionen erledigt
 * und keine zuordenbare gesperrte Lektion; NOCH GESPERRT = keine sichtbare
 * Lektion; AKTUELL = alles dazwischen.
 */
export function deriveModuleJourney(curriculum: Curriculum): ModuleJourneyItem[] {
  const phaseModule = new Map(curriculum.phases.map((p) => [p.id, p.module_id]));
  const completedSet = new Set(curriculum.completedLessonIds);

  return curriculum.modules.map((module) => {
    const moduleLessons = curriculum.lessons.filter((l) => phaseModule.get(l.learning_phase_id) === module.id);
    const lockedForModule = curriculum.lockedLessons.filter((l) => l.moduleId === module.id);
    const total = moduleLessons.length;
    const completed = moduleLessons.filter((l) => completedSet.has(l.id)).length;

    if (total > 0 && completed === total && lockedForModule.length === 0) {
      return { module, status: "completed", completed, total, lockedCount: 0 };
    }
    if (total > 0) {
      return { module, status: "current", completed, total, lockedCount: lockedForModule.length };
    }
    const lockedLabel = lockedForModule[0]?.lockedLabel ?? "Wird später freigeschaltet.";
    return { module, status: "locked", completed, total, lockedLabel, lockedCount: lockedForModule.length };
  });
}

/* ------------------------------------------------------------------------ */
/* Dashboard (HEUTE)                                                         */
/* ------------------------------------------------------------------------ */

export interface DashboardBundle {
  dashboard: DashboardData;
  curriculum: Curriculum;
}

export async function loadDashboard(supabase: Db, profileId: Uuid, cohortId: Uuid): Promise<DashboardBundle> {
  const [curriculum, progressViewRes, announcementsRes, submissionsRes, reflectionsRes, attemptsRes] =
    await Promise.all([
      loadCurriculum(supabase, profileId, cohortId),
      supabase.from("module_progress").select("*").eq("profile_id", profileId).eq("cohort_id", cohortId),
      supabase
        .from("announcements")
        .select("*")
        .eq("cohort_id", cohortId)
        .order("published_at", { ascending: false })
        .limit(10),
      supabase.from("assignment_submissions").select("content_block_id").eq("profile_id", profileId).eq("cohort_id", cohortId),
      supabase.from("reflection_entries").select("content_block_id").eq("profile_id", profileId).eq("cohort_id", cohortId),
      supabase.from("quiz_attempts").select("quiz_id, completed_at").eq("profile_id", profileId).eq("cohort_id", cohortId),
    ]);
  if (progressViewRes.error || announcementsRes.error || submissionsRes.error || reflectionsRes.error || attemptsRes.error) {
    fail();
  }

  const moduleProgresses = (progressViewRes.data ?? []) as ModuleProgress[];
  const announcements = (announcementsRes.data ?? []) as AnnouncementRow[];
  const submittedBlockIds = new Set(((submissionsRes.data ?? []) as { content_block_id: Uuid }[]).map((r) => r.content_block_id));
  const reflectedBlockIds = new Set(((reflectionsRes.data ?? []) as { content_block_id: Uuid }[]).map((r) => r.content_block_id));
  const completedQuizIds = new Set(
    ((attemptsRes.data ?? []) as { quiz_id: Uuid; completed_at: IsoDateTime | null }[])
      .filter((r) => r.completed_at !== null)
      .map((r) => r.quiz_id),
  );

  // Offene Aufgaben: required Bloecke in sichtbaren, nicht abgeschlossenen
  // Lektionen ohne zugehoerige Bearbeitung
  const completedLessonSet = new Set(curriculum.completedLessonIds);
  const candidateLessonIds = curriculum.lessons.filter((l) => !completedLessonSet.has(l.id)).map((l) => l.id);

  let openTaskCandidates: DashboardOpenTask[] = [];
  if (candidateLessonIds.length > 0) {
    const blocksRes = await supabase
      .from("content_blocks")
      .select("*")
      .in("lesson_id", candidateLessonIds)
      .eq("required", true)
      .in("block_type", ["transfer_task", "reflection", "quiz", "file_upload"]);
    if (blocksRes.error) fail();

    const lessonById = new Map(curriculum.lessons.map((l) => [l.id, l]));
    const blocks = (blocksRes.data ?? []) as ContentBlockRow[];

    openTaskCandidates = blocks
      .filter((b) => {
        if (b.block_type === "transfer_task" || b.block_type === "file_upload") return !submittedBlockIds.has(b.id);
        if (b.block_type === "reflection") return !reflectedBlockIds.has(b.id);
        const parsed = safeParseBlockConfig("quiz", b.config);
        return parsed.success ? !completedQuizIds.has(parsed.data.quizId) : false;
      })
      .map((b) => {
        const lesson = lessonById.get(b.lesson_id);
        let dueAt: IsoDateTime | null = curriculum.accessByLessonId[b.lesson_id]?.dueAt ?? null;
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

  const dashboard = deriveDashboard({
    now: new Date(),
    modules: curriculum.modules,
    phases: curriculum.phases,
    lessons: curriculum.lessons,
    sessions: curriculum.sessions,
    progressRows: curriculum.progressRows,
    releasedLessonIds: new Set(curriculum.lessons.map((l) => l.id)),
    dueAtByLessonId,
    openTaskCandidates,
    moduleProgresses,
    announcements,
  });

  return { dashboard, curriculum };
}

/* ------------------------------------------------------------------------ */
/* Lektion                                                                   */
/* ------------------------------------------------------------------------ */

/** submission_files (Migration 0004) */
export interface SubmissionFileRow {
  id: Uuid;
  submission_id: Uuid;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  original_name: string | null;
  created_at: IsoDateTime;
}

export interface SubmissionFileView extends SubmissionFileRow {
  /** Signierte URL (15 min) oder null, wenn nicht erreichbar */
  url: string | null;
}

export interface TrainerFeedbackView {
  id: Uuid;
  body: string;
  created_at: IsoDateTime;
}

export interface SubmissionView extends AssignmentSubmissionRow {
  answers: JsonObject;
  files: SubmissionFileView[];
  feedback: TrainerFeedbackView[];
}

/** Sicht auf quiz_options_public (ohne is_correct) */
export interface QuizOptionPublic {
  id: Uuid;
  question_id: Uuid;
  position: number;
  body: string;
}

export interface QuizQuestionView extends Pick<QuizQuestionRow, "id" | "position" | "kind" | "body" | "points"> {
  options: QuizOptionPublic[];
}

export interface QuizBundle {
  quiz: Pick<QuizRow, "id" | "title" | "description" | "pass_score" | "max_attempts">;
  questions: QuizQuestionView[];
  /** Eigene, abgeschlossene Versuche, neuester zuerst */
  attempts: Pick<QuizAttemptRow, "id" | "attempt_no" | "score" | "passed" | "completed_at">[];
}

export interface LessonBundle {
  lesson: LessonRow;
  phase: LearningPhaseRow | null;
  module: ModuleRow | null;
  blocks: ContentBlockRow[];
  /** block_responses.response je Block */
  responses: Record<Uuid, JsonObject>;
  reflections: Record<Uuid, ReflectionEntryRow>;
  submissions: Record<Uuid, SubmissionView>;
  quizzes: Record<Uuid, QuizBundle>;
  progress: LessonProgressRow | null;
  /** Bearbeitungsstand je Block (fuer "Lektion abschliessen") */
  done: Record<Uuid, boolean>;
  prev: LessonRow | null;
  next: LessonRow | null;
  curriculum: Curriculum;
}

/**
 * Laedt eine Lektion ueber RLS. null = nicht gefunden oder (noch) nicht
 * freigeschaltet – die Seite zeigt dann die freundliche Hinweisseite.
 */
export async function loadLesson(supabase: Db, profileId: Uuid, cohortId: Uuid, lessonId: Uuid): Promise<LessonBundle | null> {
  const [lessonRes, curriculum] = await Promise.all([
    supabase.from("lessons").select("*").eq("id", lessonId).maybeSingle(),
    loadCurriculum(supabase, profileId, cohortId),
  ]);
  if (lessonRes.error) fail();
  const lesson = (lessonRes.data as LessonRow | null) ?? null;
  if (lesson === null || lesson.status !== "published") return null;

  const phase = curriculum.phases.find((p) => p.id === lesson.learning_phase_id) ?? null;
  const module = phase !== null ? (curriculum.modules.find((m) => m.id === phase.module_id) ?? null) : null;

  const blocksRes = await supabase.from("content_blocks").select("*").eq("lesson_id", lessonId).order("position");
  if (blocksRes.error) fail();
  const blocks = (blocksRes.data ?? []) as ContentBlockRow[];
  const blockIds = blocks.map((b) => b.id);

  const quizIds = blocks
    .filter((b) => b.block_type === "quiz")
    .map((b) => {
      const parsed = safeParseBlockConfig("quiz", b.config);
      return parsed.success ? parsed.data.quizId : null;
    })
    .filter((id): id is Uuid => id !== null);

  const [responsesRes, reflectionsRes, submissionsRes, progressRes, quizzesRes, questionsRes, attemptsRes] = await Promise.all([
    blockIds.length > 0
      ? supabase
          .from("block_responses")
          .select("content_block_id, response")
          .eq("profile_id", profileId)
          .eq("cohort_id", cohortId)
          .in("content_block_id", blockIds)
      : Promise.resolve({ data: [], error: null }),
    blockIds.length > 0
      ? supabase
          .from("reflection_entries")
          .select("*")
          .eq("profile_id", profileId)
          .eq("cohort_id", cohortId)
          .in("content_block_id", blockIds)
      : Promise.resolve({ data: [], error: null }),
    blockIds.length > 0
      ? supabase
          .from("assignment_submissions")
          .select("*, submission_files(*), trainer_feedback(id, body, created_at)")
          .eq("profile_id", profileId)
          .eq("cohort_id", cohortId)
          .in("content_block_id", blockIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("lesson_progress")
      .select("*")
      .eq("lesson_id", lessonId)
      .eq("profile_id", profileId)
      .eq("cohort_id", cohortId)
      .maybeSingle(),
    quizIds.length > 0
      ? supabase.from("quizzes").select("id, title, description, pass_score, max_attempts").in("id", quizIds)
      : Promise.resolve({ data: [], error: null }),
    quizIds.length > 0
      ? supabase.from("quiz_questions").select("id, quiz_id, position, kind, body, points").in("quiz_id", quizIds).order("position")
      : Promise.resolve({ data: [], error: null }),
    quizIds.length > 0
      ? supabase
          .from("quiz_attempts")
          .select("id, quiz_id, attempt_no, score, passed, completed_at")
          .eq("profile_id", profileId)
          .eq("cohort_id", cohortId)
          .in("quiz_id", quizIds)
          .order("attempt_no", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (
    responsesRes.error ||
    reflectionsRes.error ||
    submissionsRes.error ||
    progressRes.error ||
    quizzesRes.error ||
    questionsRes.error ||
    attemptsRes.error
  ) {
    fail();
  }

  // Antwortoptionen OHNE is_correct (View quiz_options_public, Migration 0007)
  const questionRows = (questionsRes.data ?? []) as (Pick<QuizQuestionRow, "id" | "quiz_id" | "position" | "kind" | "body" | "points">)[];
  let optionRows: QuizOptionPublic[] = [];
  if (questionRows.length > 0) {
    const optionsRes = await supabase
      .from("quiz_options_public")
      .select("id, question_id, position, body")
      .in(
        "question_id",
        questionRows.map((q) => q.id),
      )
      .order("position");
    if (optionsRes.error) fail();
    optionRows = (optionsRes.data ?? []) as QuizOptionPublic[];
  }

  const responses: Record<Uuid, JsonObject> = {};
  for (const r of (responsesRes.data ?? []) as { content_block_id: Uuid; response: JsonObject }[]) {
    responses[r.content_block_id] = r.response ?? {};
  }

  const reflections: Record<Uuid, ReflectionEntryRow> = {};
  for (const r of (reflectionsRes.data ?? []) as ReflectionEntryRow[]) {
    reflections[r.content_block_id] = r;
  }

  const submissions: Record<Uuid, SubmissionView> = {};
  type SubmissionNested = AssignmentSubmissionRow & {
    answers: JsonObject | null;
    submission_files: SubmissionFileRow[] | null;
    trainer_feedback: TrainerFeedbackView[] | null;
  };
  for (const s of (submissionsRes.data ?? []) as unknown as SubmissionNested[]) {
    const { submission_files, trainer_feedback, answers, ...row } = s;
    const files = await Promise.all(
      [...(submission_files ?? [])]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map(async (f) => ({
          ...f,
          url: await createSignedUrl(supabase, PARTICIPANT_UPLOADS_BUCKET, f.storage_path, {
            download: f.original_name ?? undefined,
          }),
        })),
    );
    submissions[row.content_block_id] = {
      ...row,
      answers: answers ?? {},
      files,
      feedback: [...(trainer_feedback ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    };
  }

  const quizzes: Record<Uuid, QuizBundle> = {};
  const optionsByQuestion = new Map<Uuid, QuizOptionPublic[]>();
  for (const o of optionRows) {
    const list = optionsByQuestion.get(o.question_id) ?? [];
    list.push(o);
    optionsByQuestion.set(o.question_id, list);
  }
  const attempts = (attemptsRes.data ?? []) as (QuizBundle["attempts"][number] & { quiz_id: Uuid })[];
  for (const quiz of (quizzesRes.data ?? []) as QuizBundle["quiz"][]) {
    quizzes[quiz.id] = {
      quiz,
      questions: questionRows
        .filter((q) => q.quiz_id === quiz.id)
        .map(({ quiz_id: _q, ...q }) => ({ ...q, options: optionsByQuestion.get(q.id) ?? [] })),
      attempts: attempts.filter((a) => a.quiz_id === quiz.id && a.completed_at !== null).map(({ quiz_id: _q, ...a }) => a),
    };
  }

  const done = deriveDoneMap(blocks, { responses, reflections, submissions, quizzes });

  const index = curriculum.lessons.findIndex((l) => l.id === lessonId);
  const prev = index > 0 ? (curriculum.lessons[index - 1] ?? null) : null;
  const next = index >= 0 ? (curriculum.lessons[index + 1] ?? null) : null;

  return {
    lesson,
    phase,
    module,
    blocks,
    responses,
    reflections,
    submissions,
    quizzes,
    progress: (progressRes.data as LessonProgressRow | null) ?? null,
    done,
    prev,
    next,
    curriculum,
  };
}

/** Bearbeitungsstand je interaktivem Block aus den eigenen Datensaetzen. */
export function deriveDoneMap(
  blocks: readonly ContentBlockRow[],
  state: Pick<LessonBundle, "responses" | "reflections" | "submissions" | "quizzes">,
): Record<Uuid, boolean> {
  const done: Record<Uuid, boolean> = {};
  for (const b of blocks) {
    if (!isInteractiveBlock(b.block_type)) continue;
    const response = state.responses[b.id];
    switch (b.block_type) {
      case "checklist": {
        const parsed = safeParseBlockConfig("checklist", b.config);
        const checked = Array.isArray(response?.checked) ? (response.checked as unknown[]) : [];
        done[b.id] = parsed.success ? parsed.data.items.every((i) => checked.includes(i.id)) : false;
        break;
      }
      case "scale":
        done[b.id] = typeof response?.value === "number";
        break;
      case "single_choice":
      case "multiple_choice":
        done[b.id] = Array.isArray(response?.selected) && (response.selected as unknown[]).length > 0;
        break;
      case "practice_task":
        done[b.id] = response?.done === true;
        break;
      case "reflection":
        done[b.id] = state.reflections[b.id] !== undefined;
        break;
      case "transfer_task":
        done[b.id] = state.submissions[b.id] !== undefined;
        break;
      case "file_upload":
        done[b.id] = (state.submissions[b.id]?.files.length ?? 0) > 0;
        break;
      case "quiz": {
        const parsed = safeParseBlockConfig("quiz", b.config);
        done[b.id] = parsed.success ? (state.quizzes[parsed.data.quizId]?.attempts.length ?? 0) > 0 : false;
        break;
      }
      default:
        done[b.id] = false;
    }
  }
  return done;
}

/* ------------------------------------------------------------------------ */
/* Video (VideoProvider aus @handel-offensiv/domain)                         */
/* ------------------------------------------------------------------------ */

/** Loest eine VideoRef in eine Wiedergabequelle auf (signierte URL <= 15 min). */
export async function resolveVideoPlayback(supabase: Db, ref: VideoRef): Promise<PlaybackSource | null> {
  const registry = createVideoProviderRegistry()
    .register(createSupabaseStorageVideoProvider({ signUrl: signUrlAdapter(supabase), ttlSeconds: SIGNED_URL_TTL_SECONDS }))
    .register(createExternalVideoProvider());
  try {
    return await registry.resolvePlayback(ref);
  } catch {
    return null;
  }
}
