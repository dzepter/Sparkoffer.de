import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, EmptyState, ModuleNumber } from "@handel-offensiv/ui";

import { BlockRenderer } from "@/components/blocks/block-renderer";
import { findMissingRequiredBlocks } from "@/features/lernen/complete";
import { loadLesson } from "@/features/lernen/data";
import { formatDue, formatMinutes } from "@/features/lernen/format";
import { uploadPrefix } from "@/features/lernen/upload-path";
import { requireCampusSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { CompleteLessonForm } from "./complete-lesson-form";

export const metadata: Metadata = { title: "Lektion" };

const PHASE_LABEL: Record<string, string> = {
  before_day: "Vor dem Offensivtag",
  day: "Offensivtag",
  after_day: "Nach dem Offensivtag",
  prep_next: "Vorbereitung",
};

/**
 * Lektionsansicht: Kopf (Modulnummer, Phase, Titel, Dauer), alle Inhalts-
 * bausteine in Reihenfolge, Abschluss-CTA und Navigation zur vorherigen/
 * naechsten Lektion. Die Lektion selbst kommt ueber RLS – gesperrte oder
 * unbekannte Lektionen fuehren zur freundlichen Hinweisseite (not-found).
 */
export default async function LektionPage({ params }: { params: Promise<{ lektionId: string }> }) {
  const { lektionId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(lektionId)) notFound();

  const session = await requireCampusSession();
  if (session.cohort === null || session.organization === null) {
    return (
      <EmptyState
        title="Sie sind noch keiner Gruppe zugeordnet"
        description="Sobald Sie einer Gruppe zugeordnet sind, finden Sie hier Ihre Lektionen."
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  const bundle = await loadLesson(supabase, session.userId, session.cohort.id, lektionId);
  if (bundle === null) notFound();

  const cohortId = session.cohort.id;
  const { lesson, module, phase, blocks, prev, next } = bundle;
  const missing = findMissingRequiredBlocks(blocks, bundle.done);
  const dueAt = bundle.curriculum.accessByLessonId[lesson.id]?.dueAt ?? null;
  const prefix = uploadPrefix(session.organization.id, session.cohort.id, session.userId);
  const phaseLabel = phase ? (PHASE_LABEL[phase.phase_type] ?? phase.title) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Zurück" className="mb-4 text-sm">
        <Link href={module ? `/programm#modul-${module.id}` : "/programm"} className="inline-flex min-h-touch items-center font-bold text-navy underline underline-offset-2">
          ← Zum Programm
        </Link>
      </nav>

      <header className="mb-6 flex gap-4 border-b border-line pb-6 sm:mb-8">
        {module ? <ModuleNumber label={module.number_label} className="shrink-0" /> : null}
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">
            {module ? `Modul ${module.number_label} · ${module.title}` : "Lektion"}
            {phaseLabel ? ` · ${phaseLabel}` : ""}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">{lesson.title}</h1>
          {lesson.summary ? <p className="mt-2 text-sm text-ink-soft">{lesson.summary}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
            {lesson.estimated_minutes !== null ? <span>ca. {formatMinutes(lesson.estimated_minutes)}</span> : null}
            {dueAt ? <Badge tone="brand">{formatDue(dueAt)}</Badge> : null}
            {bundle.progress?.status === "completed" ? <Badge tone="success">Abgeschlossen</Badge> : null}
          </div>
        </div>
      </header>

      {blocks.length === 0 ? (
        <EmptyState title="Noch keine Inhalte" description="Die Inhalte dieser Lektion werden gerade vorbereitet." />
      ) : (
        <div className="space-y-5">
          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} bundle={bundle} supabase={supabase} cohortId={cohortId} uploadPrefix={prefix} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <CompleteLessonForm
          lessonId={lesson.id}
          cohortId={cohortId}
          completedAt={bundle.progress?.status === "completed" ? bundle.progress.completed_at : null}
          missingCount={missing.length}
          next={next ? { id: next.id, title: next.title } : null}
        />
      </div>

      <nav aria-label="Lektionen" className="mt-6 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
        {prev ? (
          <Link href={`/lektionen/${prev.id}`} className="inline-flex min-h-touch items-center text-sm font-bold text-navy underline underline-offset-2">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/lektionen/${next.id}`} className="inline-flex min-h-touch items-center text-sm font-bold text-navy underline underline-offset-2 sm:text-right">
            {next.title} →
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
