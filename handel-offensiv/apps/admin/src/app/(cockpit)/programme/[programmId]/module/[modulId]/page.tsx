import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { can } from "@handel-offensiv/domain";
import type {
  ContentStatus,
  LearningPhaseRow,
  LessonRow,
  ModuleRow,
  ProgramRow,
} from "@handel-offensiv/types";

import { ConfirmSubmit } from "@/app/(cockpit)/inhalte/_components/confirm-submit";
import { LinkButton } from "@/app/(cockpit)/inhalte/_components/link-button";
import { firstParam, Notice } from "@/app/(cockpit)/inhalte/_components/notice";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { getActorContext } from "@/lib/auth";
import {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_TONES,
  PHASE_TYPE_LABELS,
} from "@/lib/content-meta";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { deletePhaseAction, moveLessonAction, movePhaseAction } from "../../../actions";
import { LessonDialog } from "./lesson-dialog";
import { PhaseDialog } from "./phase-dialog";

/**
 * Modul-Detail: Lernphasen in Reihenfolge (§8), je Phase die Lektionen –
 * anlegen, bearbeiten, umsortieren per Pfeile (§24).
 */

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ARROW_BTN =
  "inline-flex min-h-touch min-w-touch items-center justify-center rounded border border-line bg-white text-lg text-ink-soft hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-35";

export default async function ModulDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ programmId: string; modulId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { programmId, modulId } = await params;
  const sp = await searchParams;
  if (!UUID_RE.test(programmId) || !UUID_RE.test(modulId)) notFound();

  const session = await getActorContext();
  if (!session) redirect("/login");
  if (!can(session.actor, "content.edit")) {
    return (
      <>
        <PageHeader kicker="Programme" title="Modul" />
        <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const [programRes, moduleRes, phasesRes] = await Promise.all([
    supabase.from("programs").select("id, title").eq("id", programmId).maybeSingle(),
    supabase.from("modules").select("*").eq("id", modulId).maybeSingle(),
    supabase
      .from("learning_phases")
      .select("*")
      .eq("module_id", modulId)
      .order("position", { ascending: true }),
  ]);

  if (programRes.error || moduleRes.error || phasesRes.error) {
    return (
      <>
        <PageHeader kicker="Programme" title="Modul" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }

  const program = programRes.data as Pick<ProgramRow, "id" | "title"> | null;
  const module = moduleRes.data as ModuleRow | null;
  if (program === null || module === null || module.program_id !== programmId) notFound();

  const phases = (phasesRes.data ?? []) as LearningPhaseRow[];
  const phaseIds = phases.map((p) => p.id);

  let lessonsByPhase = new Map<string, LessonRow[]>();
  let lessonsError = false;
  if (phaseIds.length > 0) {
    const lessonsRes = await supabase
      .from("lessons")
      .select("*")
      .in("learning_phase_id", phaseIds)
      .order("position", { ascending: true });
    if (lessonsRes.error) {
      lessonsError = true;
    } else {
      lessonsByPhase = new Map();
      for (const lesson of (lessonsRes.data ?? []) as LessonRow[]) {
        const list = lessonsByPhase.get(lesson.learning_phase_id) ?? [];
        list.push(lesson);
        lessonsByPhase.set(lesson.learning_phase_id, list);
      }
    }
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href={`/programme/${program.id}`}
          className="text-xs font-bold uppercase tracking-kicker text-ink-soft hover:text-ink"
        >
          ← {program.title}
        </Link>
      </div>

      <PageHeader
        kicker={`Programme / ${program.title}`}
        title={`${module.number_label} · ${module.title}`}
        description={module.claim ?? undefined}
        actions={
          <>
            <Badge tone={CONTENT_STATUS_TONES[module.status as ContentStatus]}>
              {CONTENT_STATUS_LABELS[module.status as ContentStatus]}
            </Badge>
            <PhaseDialog
              programId={program.id}
              moduleId={module.id}
              triggerLabel="Lernphase anlegen"
              triggerVariant="primary"
              triggerSize="md"
            />
          </>
        }
      />

      <Notice fehler={firstParam(sp.fehler)} erfolg={firstParam(sp.erfolg)} />

      {lessonsError ? <ErrorState message={ERROR_MESSAGES.load} className="mb-6" /> : null}

      {phases.length === 0 ? (
        <EmptyState
          title="Noch keine Lernphasen"
          description="Strukturieren Sie das Modul in Lernphasen, z. B. Vor dem Präsenztag, Präsenztag, Danach."
          action={
            <PhaseDialog
              programId={program.id}
              moduleId={module.id}
              triggerLabel="Lernphase anlegen"
              triggerVariant="primary"
              triggerSize="md"
            />
          }
        />
      ) : (
        <div className="space-y-6">
          {phases.map((phase, phaseIndex) => {
            const lessons = lessonsByPhase.get(phase.id) ?? [];
            return (
              <Card
                key={phase.id}
                title={
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="text-2xl font-extrabold tracking-tight text-green-deep"
                    >
                      {String(phaseIndex + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h2 className="text-base font-bold uppercase tracking-tight text-ink">
                        {phase.title}
                      </h2>
                      <p className="text-xs text-ink-soft">{PHASE_TYPE_LABELS[phase.phase_type]}</p>
                    </div>
                  </div>
                }
                action={
                  <div className="flex items-center gap-2">
                    <form action={movePhaseAction}>
                      <input type="hidden" name="programmId" value={program.id} />
                      <input type="hidden" name="modulId" value={module.id} />
                      <input type="hidden" name="phaseId" value={phase.id} />
                      <input type="hidden" name="richtung" value="hoch" />
                      <button
                        type="submit"
                        className={ARROW_BTN}
                        disabled={phaseIndex === 0}
                        aria-label={`Lernphase ${phase.title} nach oben verschieben`}
                      >
                        ↑
                      </button>
                    </form>
                    <form action={movePhaseAction}>
                      <input type="hidden" name="programmId" value={program.id} />
                      <input type="hidden" name="modulId" value={module.id} />
                      <input type="hidden" name="phaseId" value={phase.id} />
                      <input type="hidden" name="richtung" value="runter" />
                      <button
                        type="submit"
                        className={ARROW_BTN}
                        disabled={phaseIndex === phases.length - 1}
                        aria-label={`Lernphase ${phase.title} nach unten verschieben`}
                      >
                        ↓
                      </button>
                    </form>
                    <PhaseDialog
                      programId={program.id}
                      moduleId={module.id}
                      phase={{ id: phase.id, phase_type: phase.phase_type, title: phase.title }}
                      triggerLabel="Bearbeiten"
                    />
                    <form action={deletePhaseAction}>
                      <input type="hidden" name="programmId" value={program.id} />
                      <input type="hidden" name="modulId" value={module.id} />
                      <input type="hidden" name="phaseId" value={phase.id} />
                      <ConfirmSubmit
                        message={`Lernphase "${phase.title}" wirklich löschen? Das ist nur möglich, solange sie keine Lektionen enthält.`}
                        ariaLabel={`Lernphase ${phase.title} löschen`}
                      >
                        Löschen
                      </ConfirmSubmit>
                    </form>
                  </div>
                }
              >
                {lessons.length === 0 ? (
                  <p className="text-sm text-ink-soft">
                    Noch keine Lektionen in dieser Lernphase.
                  </p>
                ) : (
                  <ul className="divide-y divide-line/60">
                    {lessons.map((lesson, lessonIndex) => (
                      <li
                        key={lesson.id}
                        className="flex flex-wrap items-center gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <span
                          aria-hidden="true"
                          className="w-8 shrink-0 text-sm font-extrabold tabular-nums text-ink-soft"
                        >
                          {String(lessonIndex + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-ink">{lesson.title}</p>
                          <p className="truncate text-xs text-ink-soft">
                            {[
                              lesson.summary,
                              lesson.estimated_minutes !== null
                                ? `ca. ${lesson.estimated_minutes} Min.`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Ohne Zusammenfassung"}
                          </p>
                        </div>
                        <Badge tone={CONTENT_STATUS_TONES[lesson.status as ContentStatus]}>
                          {CONTENT_STATUS_LABELS[lesson.status as ContentStatus]}
                        </Badge>
                        <div className="flex shrink-0 items-center gap-2">
                          <form action={moveLessonAction}>
                            <input type="hidden" name="programmId" value={program.id} />
                            <input type="hidden" name="modulId" value={module.id} />
                            <input type="hidden" name="phaseId" value={phase.id} />
                            <input type="hidden" name="lektionId" value={lesson.id} />
                            <input type="hidden" name="richtung" value="hoch" />
                            <button
                              type="submit"
                              className={ARROW_BTN}
                              disabled={lessonIndex === 0}
                              aria-label={`Lektion ${lesson.title} nach oben verschieben`}
                            >
                              ↑
                            </button>
                          </form>
                          <form action={moveLessonAction}>
                            <input type="hidden" name="programmId" value={program.id} />
                            <input type="hidden" name="modulId" value={module.id} />
                            <input type="hidden" name="phaseId" value={phase.id} />
                            <input type="hidden" name="lektionId" value={lesson.id} />
                            <input type="hidden" name="richtung" value="runter" />
                            <button
                              type="submit"
                              className={ARROW_BTN}
                              disabled={lessonIndex === lessons.length - 1}
                              aria-label={`Lektion ${lesson.title} nach unten verschieben`}
                            >
                              ↓
                            </button>
                          </form>
                          <LessonDialog
                            programId={program.id}
                            moduleId={module.id}
                            phaseId={phase.id}
                            lesson={{
                              id: lesson.id,
                              title: lesson.title,
                              summary: lesson.summary,
                              estimated_minutes: lesson.estimated_minutes,
                            }}
                            triggerLabel="Bearbeiten"
                          />
                          <LinkButton href={`/inhalte/${lesson.id}`} variant="ghost">
                            Inhalte
                          </LinkButton>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 border-t border-line/60 pt-4">
                  <LessonDialog
                    programId={program.id}
                    moduleId={module.id}
                    phaseId={phase.id}
                    triggerLabel="Lektion anlegen"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
