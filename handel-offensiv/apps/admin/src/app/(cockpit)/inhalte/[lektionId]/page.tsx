import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { can } from "@handel-offensiv/domain";
import type { ContentBlockRow, ContentStatus, LessonRow } from "@handel-offensiv/types";
import { safeParseBlockConfig } from "@handel-offensiv/validation";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { getActorContext } from "@/lib/auth";
import {
  BLOCK_TYPE_LABELS,
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_TONES,
} from "@/lib/content-meta";
import { formatDateTime } from "@/lib/datetime";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ConfirmSubmit } from "../_components/confirm-submit";
import { firstParam, Notice } from "../_components/notice";
import {
  archiveLessonAction,
  deleteBlockAction,
  duplicateBlockAction,
  moveBlockAction,
  publishLessonAction,
  revertLessonToDraftAction,
} from "../actions";
import { BlockDialog } from "./block-dialog";
import { LessonMetaForm } from "./lesson-meta-form";

/**
 * Lektions-Editor (§24): Content-Blöcke in Reihenfolge, hinzufügen (14 Typen),
 * umsortieren per Pfeile, duplizieren, löschen; Entwurf speichern,
 * Veröffentlichen (content.publish), Archivieren, Versionsinfo.
 */

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ARROW_BTN =
  "inline-flex min-h-touch min-w-touch items-center justify-center rounded border border-line bg-white text-lg text-ink-soft hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-35";

const GHOST_SUBMIT =
  "inline-flex min-h-touch items-center justify-center rounded px-3 text-sm font-bold uppercase tracking-kicker text-ink-soft hover:bg-line/50 hover:text-ink";

interface LessonContext {
  id: string;
  title: string;
  module: {
    id: string;
    number_label: string;
    title: string;
    program: { id: string; title: string } | null;
  } | null;
}

/** Kurze deutsche Inhaltszusammenfassung eines Blocks fuer die Liste. */
function blockSummary(block: ContentBlockRow): string {
  const cfg = block.config as Record<string, unknown>;
  const text = (key: string): string => (typeof cfg[key] === "string" ? (cfg[key] as string) : "");
  const shorten = (value: string): string => {
    const plain = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return plain.length > 90 ? `${plain.slice(0, 90)} …` : plain;
  };

  switch (block.block_type) {
    case "text":
      return shorten(text("html") || text("markdown")) || "Textinhalt";
    case "video":
    case "audio":
    case "pdf":
    case "download":
    case "transfer_task":
      return text("title") || "Ohne Titel";
    case "image":
      return text("alt") || "Bild";
    case "checklist": {
      const count = Array.isArray(cfg.items) ? cfg.items.length : 0;
      return count === 1 ? "1 Punkt" : `${count} Punkte`;
    }
    case "reflection":
    case "single_choice":
    case "multiple_choice":
    case "scale":
      return shorten(text("question")) || "Frage";
    case "quiz":
      return "Verknüpftes Quiz";
    case "external_link":
      return text("label") || text("url") || "Externer Link";
  }
}

export default async function LektionsEditorPage({
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
  if (!can(session.actor, "content.edit")) {
    return (
      <>
        <PageHeader kicker="Inhalte" title="Lektions-Editor" />
        <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />
      </>
    );
  }
  const canPublish = can(session.actor, "content.publish");

  const supabase = await createSupabaseServerClient();
  const [lessonRes, blocksRes, quizzesRes] = await Promise.all([
    supabase.from("lessons").select("*").eq("id", lektionId).maybeSingle(),
    supabase
      .from("content_blocks")
      .select("*")
      .eq("lesson_id", lektionId)
      .order("position", { ascending: true }),
    supabase.from("quizzes").select("id, title").order("title", { ascending: true }),
  ]);

  if (lessonRes.error || blocksRes.error) {
    return (
      <>
        <PageHeader kicker="Inhalte" title="Lektions-Editor" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }

  const lesson = lessonRes.data as LessonRow | null;
  if (lesson === null) notFound();

  const contextRes = await supabase
    .from("learning_phases")
    .select("id, title, module:modules(id, number_label, title, program:programs(id, title))")
    .eq("id", lesson.learning_phase_id)
    .maybeSingle();
  const context = (contextRes.data ?? null) as unknown as LessonContext | null;
  const blocks = (blocksRes.data ?? []) as ContentBlockRow[];
  const quizzes = (quizzesRes.data ?? []) as Array<{ id: string; title: string }>;

  // Versionsinfo: Namen der beteiligten Profile aufloesen
  const profileIds = [lesson.created_by, lesson.updated_by].filter(
    (id): id is string => id !== null,
  );
  let profileNames = new Map<string, string>();
  if (profileIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", profileIds);
    profileNames = new Map(
      (
        (profilesData ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null }>
      ).map((p) => [p.id, [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unbekannt"]),
    );
  }

  const status = lesson.status as ContentStatus;
  const invalidBlockCount = blocks.filter(
    (block) => !safeParseBlockConfig(block.block_type, block.config).success,
  ).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-kicker text-ink-soft">
        <Link href="/inhalte" className="hover:text-ink">
          ← Alle Inhalte
        </Link>
        {context?.module?.program ? (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/programme/${context.module.program.id}`} className="hover:text-ink">
              {context.module.program.title}
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/programme/${context.module.program.id}/module/${context.module.id}`}
              className="hover:text-ink"
            >
              {context.module.number_label} {context.module.title}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{context.title}</span>
          </>
        ) : null}
      </div>

      <PageHeader
        kicker="Lektions-Editor"
        title={lesson.title}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={CONTENT_STATUS_TONES[status]}>{CONTENT_STATUS_LABELS[status]}</Badge>

            {status !== "published" && canPublish ? (
              <form action={publishLessonAction}>
                <input type="hidden" name="lektionId" value={lesson.id} />
                <button
                  type="submit"
                  className="inline-flex min-h-touch items-center justify-center rounded bg-green px-5 text-sm font-bold uppercase tracking-kicker text-dark hover:bg-green-bright"
                >
                  Veröffentlichen
                </button>
              </form>
            ) : null}

            {status !== "archived" ? (
              <form action={archiveLessonAction}>
                <input type="hidden" name="lektionId" value={lesson.id} />
                <ConfirmSubmit
                  message="Lektion wirklich archivieren? Teilnehmer sehen sie danach nicht mehr."
                  className="text-ink-soft hover:bg-line/50 hover:text-ink"
                >
                  Archivieren
                </ConfirmSubmit>
              </form>
            ) : null}

            {status !== "draft" ? (
              <form action={revertLessonToDraftAction}>
                <input type="hidden" name="lektionId" value={lesson.id} />
                <button type="submit" className={GHOST_SUBMIT}>
                  In den Entwurf
                </button>
              </form>
            ) : null}
          </div>
        }
      />

      <Notice fehler={firstParam(sp.fehler)} erfolg={firstParam(sp.erfolg)} />

      {invalidBlockCount > 0 ? (
        <div
          role="status"
          className="mb-6 rounded border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-ink"
        >
          {invalidBlockCount === 1
            ? "1 Block ist unvollständig konfiguriert."
            : `${invalidBlockCount} Blöcke sind unvollständig konfiguriert.`}{" "}
          Vor dem Veröffentlichen bitte korrigieren.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card
            title="Inhalt der Lektion"
            action={
              <BlockDialog
                lessonId={lesson.id}
                quizzes={quizzes}
                triggerLabel="Block hinzufügen"
                triggerVariant="primary"
              />
            }
          >
            {blocks.length === 0 ? (
              <EmptyState
                title="Noch keine Inhalte"
                description="Fügen Sie den ersten Block hinzu – Text, Video, Checkliste, Quiz und mehr."
                action={
                  <BlockDialog
                    lessonId={lesson.id}
                    quizzes={quizzes}
                    triggerLabel="Block hinzufügen"
                    triggerVariant="primary"
                    triggerSize="md"
                  />
                }
              />
            ) : (
              <ol className="space-y-3">
                {blocks.map((block, index) => {
                  const valid = safeParseBlockConfig(block.block_type, block.config).success;
                  return (
                    <li
                      key={block.id}
                      className="flex flex-wrap items-center gap-4 rounded border border-line bg-white p-4"
                    >
                      <span
                        aria-hidden="true"
                        className="w-10 shrink-0 text-2xl font-extrabold tabular-nums tracking-tight text-green-deep"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold uppercase tracking-kicker text-ink">
                            {BLOCK_TYPE_LABELS[block.block_type]}
                          </span>
                          {block.required ? <Badge tone="brand">Pflicht</Badge> : null}
                          {!valid ? <Badge tone="warning">Unvollständig</Badge> : null}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-ink-soft">{blockSummary(block)}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <form action={moveBlockAction}>
                          <input type="hidden" name="lektionId" value={lesson.id} />
                          <input type="hidden" name="blockId" value={block.id} />
                          <input type="hidden" name="richtung" value="hoch" />
                          <button
                            type="submit"
                            className={ARROW_BTN}
                            disabled={index === 0}
                            aria-label={`Block ${index + 1} nach oben verschieben`}
                          >
                            ↑
                          </button>
                        </form>
                        <form action={moveBlockAction}>
                          <input type="hidden" name="lektionId" value={lesson.id} />
                          <input type="hidden" name="blockId" value={block.id} />
                          <input type="hidden" name="richtung" value="runter" />
                          <button
                            type="submit"
                            className={ARROW_BTN}
                            disabled={index === blocks.length - 1}
                            aria-label={`Block ${index + 1} nach unten verschieben`}
                          >
                            ↓
                          </button>
                        </form>

                        <BlockDialog
                          lessonId={lesson.id}
                          quizzes={quizzes}
                          block={{
                            id: block.id,
                            block_type: block.block_type,
                            config: block.config,
                            required: block.required,
                          }}
                          triggerLabel="Bearbeiten"
                        />

                        <form action={duplicateBlockAction}>
                          <input type="hidden" name="lektionId" value={lesson.id} />
                          <input type="hidden" name="blockId" value={block.id} />
                          <button
                            type="submit"
                            className={GHOST_SUBMIT}
                            aria-label={`Block ${index + 1} duplizieren`}
                          >
                            Duplizieren
                          </button>
                        </form>

                        <form action={deleteBlockAction}>
                          <input type="hidden" name="lektionId" value={lesson.id} />
                          <input type="hidden" name="blockId" value={block.id} />
                          <ConfirmSubmit
                            message="Diesen Block wirklich löschen?"
                            ariaLabel={`Block ${index + 1} löschen`}
                          >
                            Löschen
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Lektion">
            <LessonMetaForm
              lesson={{
                id: lesson.id,
                title: lesson.title,
                summary: lesson.summary,
                estimated_minutes: lesson.estimated_minutes,
              }}
            />
          </Card>

          <Card title="Versionsinfo">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-kicker text-ink-soft">
                  Angelegt
                </dt>
                <dd className="mt-0.5 text-ink">
                  {formatDateTime(lesson.created_at)}
                  {lesson.created_by ? (
                    <span className="block text-xs text-ink-soft">
                      von {profileNames.get(lesson.created_by) ?? "Unbekannt"}
                    </span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-kicker text-ink-soft">
                  Zuletzt geändert
                </dt>
                <dd className="mt-0.5 text-ink">
                  {formatDateTime(lesson.updated_at)}
                  {lesson.updated_by ? (
                    <span className="block text-xs text-ink-soft">
                      von {profileNames.get(lesson.updated_by) ?? "Unbekannt"}
                    </span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-kicker text-ink-soft">
                  Veröffentlicht
                </dt>
                <dd className="mt-0.5 text-ink">
                  {lesson.published_at ? formatDateTime(lesson.published_at) : "Noch nicht veröffentlicht"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Vorschau">
            <p className="text-sm text-ink-soft">
              Prüfen Sie die Lektion aus Teilnehmersicht – inklusive Freischaltungslogik der
              jeweiligen Gruppe.
            </p>
            <Link
              href="/vorschau"
              className="mt-3 inline-flex min-h-touch items-center justify-center rounded border border-ink bg-white px-5 text-sm font-bold uppercase tracking-kicker text-ink hover:bg-paper"
            >
              Vorschau als Teilnehmer
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
