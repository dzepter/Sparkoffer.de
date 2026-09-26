import type { Metadata } from "next";
import Link from "next/link";

import type { LearningPhaseRow, LessonRow } from "@handel-offensiv/types";
import { Badge, EmptyState, ModuleNumber, PageHeader, ProgressBar, cn } from "@handel-offensiv/ui";

import { deriveModuleJourney, loadCurriculum, type Curriculum, type ModuleJourneyItem } from "@/features/lernen/data";
import { formatDue, formatMinutes } from "@/features/lernen/format";
import { requireCampusSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Programm" };

const PHASE_LABEL: Record<string, string> = {
  before_day: "Vor dem Offensivtag",
  day: "Offensivtag",
  after_day: "Nach dem Offensivtag",
  prep_next: "Vorbereitung",
};

const STATUS_LABEL: Record<ModuleJourneyItem["status"], { label: string; tone: "success" | "brand" | "neutral" }> = {
  completed: { label: "Abgeschlossen", tone: "success" },
  current: { label: "Aktuell", tone: "brand" },
  locked: { label: "Noch gesperrt", tone: "neutral" },
};

/**
 * MEIN PROGRAMM (§12/§15): fuenf Module mit Modulnummer 01–05 in Gold,
 * Claim, Fortschritt je Modul, Lernphasen und Lektionen mit Zustand
 * (frei / abgeschlossen / gesperrt). Gesperrte Lektionen sind fuer
 * Teilnehmer per RLS unsichtbar – ihr Sperrtext stammt aus der Regelzeile.
 */
export default async function ProgrammPage() {
  const session = await requireCampusSession();
  if (session.cohort === null) {
    return (
      <div>
        <PageHeader kicker="Mein Programm" title="Handel Offensiv" />
        <EmptyState
          title="Sie sind noch keiner Gruppe zugeordnet"
          description="Sobald Ihr Unternehmen Sie einer Gruppe zugeordnet hat, erscheinen hier Ihre Module und Lektionen."
        />
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const curriculum = await loadCurriculum(supabase, session.userId, session.cohort.id);
  const journey = deriveModuleJourney(curriculum);
  const completedSet = new Set(curriculum.completedLessonIds);
  const unassignedLocked = curriculum.lockedLessons.filter((l) => l.moduleId === null);

  return (
    <div>
      <PageHeader
        kicker="Mein Programm"
        title={curriculum.program?.title ?? "Handel Offensiv"}
        description={curriculum.program?.subtitle ?? "Handel ist Mannschaftssport. Führung entscheidet das Spiel."}
      />

      {journey.length === 0 ? (
        <EmptyState title="Noch keine Module veröffentlicht" description="Die Inhalte Ihres Programms werden gerade vorbereitet." />
      ) : (
        <ol className="space-y-6">
          {journey.map((item) => (
            <li key={item.module.id} id={`modul-${item.module.id}`} className="scroll-mt-24">
              <ModuleSection item={item} curriculum={curriculum} completedSet={completedSet} />
            </li>
          ))}
        </ol>
      )}

      {unassignedLocked.length > 0 ? (
        <section aria-label="Weitere Lektionen" className="mt-8 rounded border border-dashed border-line bg-paper p-5">
          <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">Weitere Lektionen (noch gesperrt)</p>
          <ul className="mt-2 space-y-1 text-sm text-ink-soft">
            {groupLockedLabels(unassignedLocked.map((l) => l.lockedLabel)).map(([label, count]) => (
              <li key={label}>
                {count === 1 ? "1 Lektion" : `${count} Lektionen`}: {label}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function groupLockedLabels(labels: string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  return [...counts.entries()];
}

function ModuleSection({ item, curriculum, completedSet }: { item: ModuleJourneyItem; curriculum: Curriculum; completedSet: Set<string> }) {
  const { module, status } = item;
  const phases = curriculum.phases.filter((p) => p.module_id === module.id);
  const badge = STATUS_LABEL[status];
  const percent = item.total === 0 ? 0 : Math.round((item.completed / item.total) * 100);

  return (
    <article className={cn("rounded border border-line bg-white", status === "locked" && "bg-paper")}>
      <header className="flex gap-4 p-5 sm:gap-6">
        <ModuleNumber label={module.number_label} size="lg" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold leading-tight text-ink">{module.title}</h2>
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </div>
          {module.claim ? <p className="mt-1 text-sm text-ink-soft">{module.claim}</p> : null}
          {status === "locked" ? (
            <p className="mt-2 text-sm text-ink-soft">{item.lockedLabel}</p>
          ) : (
            <ProgressBar className="mt-3 max-w-md" percent={percent} label={`${item.completed} von ${item.total} Lektionen`} />
          )}
        </div>
      </header>

      {status !== "locked" ? (
        <div className="divide-y divide-line border-t border-line">
          {phases.map((phase) => (
            <PhaseSection key={phase.id} phase={phase} curriculum={curriculum} completedSet={completedSet} />
          ))}
          {item.lockedCount > 0 ? (
            <p className="px-5 py-3 text-sm text-ink-soft">
              {item.lockedCount === 1 ? "Eine weitere Lektion" : `${item.lockedCount} weitere Lektionen`} dieses Moduls:{" "}
              {curriculum.lockedLessons.find((l) => l.moduleId === module.id)?.lockedLabel ?? "Wird später freigeschaltet."}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function PhaseSection({ phase, curriculum, completedSet }: { phase: LearningPhaseRow; curriculum: Curriculum; completedSet: Set<string> }) {
  const lessons = curriculum.lessons.filter((l) => l.learning_phase_id === phase.id);
  if (lessons.length === 0) return null;
  const label = PHASE_LABEL[phase.phase_type] ?? phase.title;

  return (
    <section aria-label={label} className="px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">{label}</p>
      <ul className="mt-2 divide-y divide-line/70">
        {lessons.map((lesson) => (
          <LessonRowItem key={lesson.id} lesson={lesson} completed={completedSet.has(lesson.id)} dueAt={curriculum.accessByLessonId[lesson.id]?.dueAt ?? null} />
        ))}
      </ul>
    </section>
  );
}

function LessonRowItem({ lesson, completed, dueAt }: { lesson: LessonRow; completed: boolean; dueAt: string | null }) {
  return (
    <li>
      <Link href={`/lektionen/${lesson.id}`} className="flex min-h-touch items-center justify-between gap-3 py-2.5 hover:text-navy">
        <span className="min-w-0">
          <span className="block text-sm font-bold text-ink">{lesson.title}</span>
          <span className="block text-xs text-ink-soft">
            {lesson.estimated_minutes !== null ? `ca. ${formatMinutes(lesson.estimated_minutes)}` : ""}
            {lesson.estimated_minutes !== null && dueAt ? " · " : ""}
            {dueAt ? formatDue(dueAt) : ""}
          </span>
        </span>
        <Badge tone={completed ? "success" : "brand"}>{completed ? "Abgeschlossen" : "Frei"}</Badge>
      </Link>
    </li>
  );
}
