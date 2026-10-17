import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { can } from "@handel-offensiv/domain";
import type { ContentStatus, ModuleRow, ProgramRow } from "@handel-offensiv/types";

import { LinkButton } from "@/app/(cockpit)/inhalte/_components/link-button";
import { firstParam, Notice } from "@/app/(cockpit)/inhalte/_components/notice";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { getActorContext } from "@/lib/auth";
import { CONTENT_STATUS_LABELS, CONTENT_STATUS_TONES } from "@/lib/content-meta";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { moveModuleAction } from "../actions";
import { ModuleDialog } from "./module-dialog";

/**
 * Programm-Detail: Module in Positionsreihenfolge mit grosser number_label
 * (Aigner-Stil), Umsortieren per Auf-/Ab-Pfeil (§24, kein Drag-and-drop).
 */

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ModuleListRow extends ModuleRow {
  learning_phases: Array<{ count: number }>;
}

const ARROW_BTN =
  "inline-flex min-h-touch min-w-touch items-center justify-center rounded border border-line bg-white text-lg text-ink-soft hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-35";

export default async function ProgrammDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ programmId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { programmId } = await params;
  const sp = await searchParams;
  if (!UUID_RE.test(programmId)) notFound();

  const session = await getActorContext();
  if (!session) redirect("/login");
  if (!can(session.actor, "content.edit")) {
    return (
      <>
        <PageHeader kicker="Programme" title="Programm" />
        <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const [programRes, modulesRes] = await Promise.all([
    supabase.from("programs").select("*").eq("id", programmId).maybeSingle(),
    supabase
      .from("modules")
      .select("*, learning_phases(count)")
      .eq("program_id", programmId)
      .order("position", { ascending: true }),
  ]);

  if (programRes.error || modulesRes.error) {
    return (
      <>
        <PageHeader kicker="Programme" title="Programm" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }

  const program = programRes.data as ProgramRow | null;
  if (program === null) notFound();
  const modules = (modulesRes.data ?? []) as ModuleListRow[];

  const nextNumber = String(modules.length + 1).padStart(2, "0");

  return (
    <>
      <div className="mb-4">
        <Link
          href="/programme"
          className="text-xs font-bold uppercase tracking-kicker text-ink-soft hover:text-ink"
        >
          ← Alle Programme
        </Link>
      </div>

      <PageHeader
        kicker="Programme"
        title={program.title}
        description={program.subtitle ?? undefined}
        actions={
          <>
            <Badge tone={CONTENT_STATUS_TONES[program.status as ContentStatus]}>
              {CONTENT_STATUS_LABELS[program.status as ContentStatus]}
            </Badge>
            <LinkButton href={`/programme/${program.id}/bearbeiten`}>Bearbeiten</LinkButton>
            <ModuleDialog
              programId={program.id}
              numberLabelVorschlag={nextNumber}
              triggerLabel="Modul anlegen"
              triggerVariant="primary"
              triggerSize="md"
            />
          </>
        }
      />

      <Notice fehler={firstParam(sp.fehler)} erfolg={firstParam(sp.erfolg)} />

      {program.description ? (
        <p className="mb-8 max-w-3xl text-sm text-ink-soft">{program.description}</p>
      ) : null}

      {modules.length === 0 ? (
        <EmptyState
          title="Noch keine Module"
          description="Legen Sie das erste Modul an – Teilnehmer sehen Module in dieser Reihenfolge (01–05)."
          action={
            <ModuleDialog
              programId={program.id}
              numberLabelVorschlag="01"
              triggerLabel="Modul anlegen"
              triggerVariant="primary"
              triggerSize="md"
            />
          }
        />
      ) : (
        <ol className="space-y-4">
          {modules.map((module, index) => {
            const phaseCount = module.learning_phases[0]?.count ?? 0;
            return (
              <li
                key={module.id}
                className="pitch-lines flex flex-wrap items-center gap-6 rounded border border-line bg-white p-6"
              >
                <span
                  aria-hidden="true"
                  className="w-24 shrink-0 text-6xl font-extrabold leading-none tracking-tight text-green-deep"
                >
                  {module.number_label}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="sr-only">Modul {module.number_label}</p>
                  <h2 className="text-lg font-extrabold uppercase tracking-tight text-ink">
                    <Link
                      href={`/programme/${program.id}/module/${module.id}`}
                      className="hover:text-green-deep"
                    >
                      {module.title}
                    </Link>
                  </h2>
                  {module.claim ? (
                    <p className="mt-1 text-sm text-ink-soft">{module.claim}</p>
                  ) : null}
                  <p className="mt-2 flex items-center gap-3 text-xs text-ink-soft">
                    <Badge tone={CONTENT_STATUS_TONES[module.status as ContentStatus]}>
                      {CONTENT_STATUS_LABELS[module.status as ContentStatus]}
                    </Badge>
                    <span>
                      {phaseCount === 1 ? "1 Lernphase" : `${phaseCount} Lernphasen`}
                    </span>
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <form action={moveModuleAction}>
                    <input type="hidden" name="programmId" value={program.id} />
                    <input type="hidden" name="modulId" value={module.id} />
                    <input type="hidden" name="richtung" value="hoch" />
                    <button
                      type="submit"
                      className={ARROW_BTN}
                      disabled={index === 0}
                      aria-label={`Modul ${module.number_label} nach oben verschieben`}
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveModuleAction}>
                    <input type="hidden" name="programmId" value={program.id} />
                    <input type="hidden" name="modulId" value={module.id} />
                    <input type="hidden" name="richtung" value="runter" />
                    <button
                      type="submit"
                      className={ARROW_BTN}
                      disabled={index === modules.length - 1}
                      aria-label={`Modul ${module.number_label} nach unten verschieben`}
                    >
                      ↓
                    </button>
                  </form>

                  <ModuleDialog
                    programId={program.id}
                    module={{
                      id: module.id,
                      number_label: module.number_label,
                      title: module.title,
                      claim: module.claim,
                      description: module.description,
                      status: module.status,
                    }}
                    triggerLabel="Bearbeiten"
                  />
                  <LinkButton href={`/programme/${program.id}/module/${module.id}`} variant="ghost">
                    Öffnen
                  </LinkButton>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
