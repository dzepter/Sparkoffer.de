import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { can } from "@handel-offensiv/domain";
import type { ContentBlockRow, LessonRow } from "@handel-offensiv/types";

import { firstParam } from "@/app/(cockpit)/inhalte/_components/notice";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { evaluateLessonRelease, loadPreviewData } from "../../_lib/preview";
import { BlockPreview } from "../../block-renderer";

/**
 * Lektionsansicht der Teilnehmer-Vorschau (§25): Blöcke read-only in
 * Reihenfolge; gesperrte Lektionen zeigen den Sperrtext der Release-Engine.
 */

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface LessonContext {
  id: string;
  title: string;
  module: { id: string; number_label: string; title: string; program_id: string } | null;
}

export default async function VorschauLektionPage({
  params,
  searchParams,
}: {
  params: Promise<{ lektionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lektionId } = await params;
  const sp = await searchParams;
  if (!UUID_RE.test(lektionId)) notFound();

  const session = await getActorContext();
  if (!session) redirect("/login");
  if (!can(session.actor, "content.read")) {
    return (
      <>
        <PageHeader kicker="Vorschau" title="Lektion" />
        <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />
      </>
    );
  }

  const cohortId = firstParam(sp.gruppe);
  const orgId = firstParam(sp.unternehmen);
  const profileIdRaw = firstParam(sp.teilnehmer);
  if (cohortId === undefined || !UUID_RE.test(cohortId)) redirect("/vorschau");
  const profileId =
    profileIdRaw !== undefined && UUID_RE.test(profileIdRaw) ? profileIdRaw : null;

  const backParams = new URLSearchParams({ gruppe: cohortId });
  if (orgId !== undefined && UUID_RE.test(orgId)) backParams.set("unternehmen", orgId);
  if (profileId !== null) backParams.set("teilnehmer", profileId);
  const backHref = `/vorschau?${backParams.toString()}`;

  const supabase = await createSupabaseServerClient();
  const [lessonRes, previewResult] = await Promise.all([
    supabase.from("lessons").select("*").eq("id", lektionId).maybeSingle(),
    loadPreviewData(cohortId, profileId),
  ]);

  if (lessonRes.error || !previewResult.ok) {
    return (
      <>
        <PageHeader kicker="Vorschau" title="Lektion" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }
  const lesson = lessonRes.data as LessonRow | null;
  if (lesson === null) notFound();
  const preview = previewResult.data;

  // Kontext: Phase -> Modul; Lektion muss zum Programm der Gruppe gehoeren
  const contextRes = await supabase
    .from("learning_phases")
    .select("id, title, module:modules(id, number_label, title, program_id)")
    .eq("id", lesson.learning_phase_id)
    .maybeSingle();
  const context = (contextRes.data ?? null) as unknown as LessonContext | null;
  if (context?.module === undefined || context?.module === null) notFound();
  if (context.module.program_id !== preview.cohort.program_id) notFound();

  const decision = evaluateLessonRelease(preview, lesson.id, profileId);
  const isDraft = lesson.status !== "published";

  let blocks: ContentBlockRow[] = [];
  let blocksError = false;
  if (decision.released) {
    const blocksRes = await supabase
      .from("content_blocks")
      .select("*")
      .eq("lesson_id", lesson.id)
      .order("position", { ascending: true });
    blocksError = blocksRes.error !== null;
    blocks = (blocksRes.data ?? []) as ContentBlockRow[];
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href={backHref}
          className="text-xs font-bold uppercase tracking-kicker text-ink-soft hover:text-ink"
        >
          ← Zur Programmansicht
        </Link>
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-kicker text-ink-soft">
            <span aria-hidden="true" className="font-extrabold text-green-deep">
              //
            </span>
            Teilnehmersicht · Modul {context.module.number_label} · {context.title}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold uppercase leading-tight tracking-tight text-ink">
            {lesson.title}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
            {lesson.estimated_minutes !== null ? <span>ca. {lesson.estimated_minutes} Min.</span> : null}
            {decision.released ? (
              <Badge tone="brand">Freigeschaltet</Badge>
            ) : (
              <Badge tone="neutral">Gesperrt</Badge>
            )}
          </p>
          {lesson.summary ? <p className="mt-3 text-sm text-ink-soft">{lesson.summary}</p> : null}
        </div>

        {isDraft ? (
          <div
            role="status"
            className="mb-6 rounded border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-ink"
          >
            Diese Lektion ist im Status „{lesson.status === "archived" ? "Archiviert" : "Entwurf"}“ –
            Teilnehmer sehen sie in der App nicht.
          </div>
        ) : null}

        {!decision.released ? (
          <div className="pitch-lines rounded border border-line bg-paper px-6 py-12 text-center">
            <span aria-hidden="true" className="text-lg font-extrabold text-green-deep">
              //
            </span>
            <h2 className="mt-2 text-base font-bold text-ink">Diese Lektion ist noch gesperrt</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {decision.lockedLabel ?? "Diese Lektion ist noch nicht freigeschaltet."}
            </p>
          </div>
        ) : blocksError ? (
          <ErrorState message={ERROR_MESSAGES.load} />
        ) : blocks.length === 0 ? (
          <p className="rounded border border-line bg-white p-5 text-sm text-ink-soft">
            Diese Lektion enthält noch keine Inhalte.
          </p>
        ) : (
          <div className="space-y-4">
            {blocks.map((block) => (
              <BlockPreview key={block.id} block={block} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
