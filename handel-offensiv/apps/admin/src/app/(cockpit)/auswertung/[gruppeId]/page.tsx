import Link from "next/link";

import { can } from "@handel-offensiv/domain";
import type { SubmissionStatus } from "@handel-offensiv/types";

import { Badge, DataTable, EmptyState, ErrorState, PageHeader, Tabs } from "@/components/ui";
import type { BadgeTone, DataTableColumn } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { markSubmissionAction } from "../actions";
import { FeedbackForm } from "./feedback-form";

export const dynamic = "force-dynamic";

/**
 * AUSWERTUNG – Gruppenansicht (§26).
 *
 * Datenzugriff ueber den SERVICE-ROLE-Client, weil Aggregation ueber alle
 * Teilnehmer noetig ist – DAVOR wird die Berechtigung des Akteurs streng
 * via can('analytics.read') im Cohort-/Organisations-Scope geprueft.
 * Abgaben werden AUSSCHLIESSLICH mit visibility='trainer' geladen –
 * private Abgaben und Reflexionen bleiben unsichtbar.
 * Bewusst: KEINE Rankings, KEIN Leaderboard, keine Geraeteinformationen,
 * letzte Aktivitaet nur als Datum (kein Minuten-Tracking).
 */

/* --------------------------------- Typen -------------------------------- */

interface MemberRow {
  profile_id: string;
  profiles: { first_name: string | null; last_name: string | null } | null;
}
interface ModuleProgressRow {
  profile_id: string;
  module_id: string;
  total_lessons: number;
  completed_lessons: number;
  percent: number;
}
interface ModuleNested {
  id: string;
  number_label: string;
  title: string;
  position: number;
  learning_phases: Array<{
    lessons: Array<{
      id: string;
      status: string;
      content_blocks: Array<{
        id: string;
        block_type: string;
        config: unknown;
      }>;
    }>;
  }>;
}
interface SubmissionRow {
  id: string;
  content_block_id: string;
  profile_id: string;
  status: SubmissionStatus;
  visibility: "private" | "trainer";
  note_text: string | null;
  file_path: string | null;
  submitted_at: string;
}
interface FeedbackRow {
  id: string;
  submission_id: string | null;
  body: string;
  created_at: string;
  author_profile_id: string;
}
interface ParticipantStats {
  profileId: string;
  name: string;
  percent: number;
  completedLessons: number;
  totalLessons: number;
  openTasks: number;
  trainerSubmissions: SubmissionRow[];
  lastActivity: string | null;
}

const STATUS_META: Record<SubmissionStatus, { label: string; tone: BadgeTone }> = {
  submitted: { label: "Neu eingereicht", tone: "warning" },
  seen: { label: "Gesehen", tone: "neutral" },
  feedback_given: { label: "Feedback gegeben", tone: "brand" },
  done: { label: "Erledigt", tone: "success" },
};

function personName(p: { first_name: string | null; last_name: string | null } | null): string {
  const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
  return name.length > 0 ? name : "Ohne Namen";
}

function blockTitle(config: unknown): string {
  if (config !== null && typeof config === "object" && !Array.isArray(config)) {
    const t = (config as Record<string, unknown>).title;
    if (typeof t === "string" && t.trim() !== "") return t;
  }
  return "Transferaufgabe";
}

function firstString(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s !== undefined && s !== "" ? s : undefined;
}

/** Zugaenglicher Fortschrittsbalken (Text + Balken, keine reine Farbcodierung). */
function ProgressBar({ percent, label }: { percent: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-2 w-full overflow-hidden rounded bg-line/60"
    >
      <div className="h-full rounded bg-green-deep" style={{ width: `${clamped}%` }} />
    </div>
  );
}

/* --------------------------------- Seite -------------------------------- */

export default async function AuswertungGruppePage(props: {
  params: Promise<{ gruppeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ gruppeId }, sp] = await Promise.all([props.params, props.searchParams]);

  const session = await getActorContext();
  if (!session) return <ErrorState message={ERROR_MESSAGES.sessionExpired} />;
  const { actor } = session;

  const admin = createSupabaseAdminClient();

  const { data: cohortData, error: cohortError } = await admin
    .from("cohorts")
    .select("id, name, organization_id, program_id, organizations(name), programs(title)")
    .eq("id", gruppeId)
    .maybeSingle();
  if (cohortError) {
    return (
      <>
        <PageHeader kicker="Auswertung" title="Gruppenansicht" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }
  if (!cohortData) {
    return (
      <>
        <PageHeader kicker="Auswertung" title="Gruppenansicht" />
        <ErrorState title="Nicht gefunden" message={ERROR_MESSAGES.notFound} />
      </>
    );
  }
  const cohort = cohortData as unknown as {
    id: string;
    name: string;
    organization_id: string;
    program_id: string;
    organizations: { name: string } | null;
    programs: { title: string } | null;
  };

  // Strenges Gate VOR jedem weiteren Datenzugriff (Trainer: nur eigene Gruppe)
  const allowed =
    can(actor, "analytics.read", { cohortId: cohort.id }) ||
    can(actor, "analytics.read", { organizationId: cohort.organization_id });
  if (!allowed) {
    return (
      <>
        <PageHeader kicker="Auswertung" title={cohort.name} />
        <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />
      </>
    );
  }
  const mayFeedback = can(actor, "submissions.feedback", { cohortId: cohort.id });

  const [membersRes, progressRes, activityRes, modulesRes, submissionsRes] = await Promise.all([
    admin
      .from("cohort_members")
      .select("profile_id, profiles(first_name, last_name)")
      .eq("cohort_id", cohort.id)
      .eq("status", "active"),
    admin
      .from("module_progress")
      .select("profile_id, module_id, total_lessons, completed_lessons, percent")
      .eq("cohort_id", cohort.id),
    admin
      .from("lesson_progress")
      .select("profile_id, updated_at")
      .eq("cohort_id", cohort.id),
    admin
      .from("modules")
      .select(
        "id, number_label, title, position, learning_phases(lessons(id, status, content_blocks(id, block_type, config)))",
      )
      .eq("program_id", cohort.program_id)
      .order("position"),
    admin
      .from("assignment_submissions")
      .select(
        "id, content_block_id, profile_id, status, visibility, note_text, file_path, submitted_at",
      )
      .eq("cohort_id", cohort.id),
  ]);

  if (
    membersRes.error ||
    progressRes.error ||
    activityRes.error ||
    modulesRes.error ||
    submissionsRes.error
  ) {
    return (
      <>
        <PageHeader kicker="Auswertung" title={cohort.name} />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }

  const members = (membersRes.data ?? []) as unknown as MemberRow[];
  const progress = (progressRes.data ?? []) as unknown as ModuleProgressRow[];
  const activity = (activityRes.data ?? []) as unknown as Array<{
    profile_id: string;
    updated_at: string;
  }>;
  const modules = (modulesRes.data ?? []) as unknown as ModuleNested[];
  const submissions = (submissionsRes.data ?? []) as unknown as SubmissionRow[];

  /* ------------------------- Transferaufgaben-Katalog ------------------- */

  // Nur Bloecke in VEROEFFENTLICHTEN Lektionen zaehlen als Aufgaben
  const taskTitleByBlock = new Map<string, { title: string; moduleLabel: string }>();
  for (const m of modules) {
    for (const phase of m.learning_phases) {
      for (const lesson of phase.lessons) {
        if (lesson.status !== "published") continue;
        for (const block of lesson.content_blocks) {
          if (block.block_type !== "transfer_task") continue;
          taskTitleByBlock.set(block.id, {
            title: blockTitle(block.config),
            moduleLabel: `Modul ${m.number_label}`,
          });
        }
      }
    }
  }
  const totalTasks = taskTitleByBlock.size;

  /* --------------------------- Kennzahlen je Person --------------------- */

  const trainerVisible = submissions
    .filter((s) => s.visibility === "trainer")
    .sort((a, b) => (a.submitted_at < b.submitted_at ? 1 : -1));

  const participants: ParticipantStats[] = members
    .map((m) => {
      const rows = progress.filter((p) => p.profile_id === m.profile_id);
      const totalLessons = rows.reduce((sum, r) => sum + r.total_lessons, 0);
      const completedLessons = rows.reduce((sum, r) => sum + r.completed_lessons, 0);
      const percent =
        totalLessons > 0 ? Math.round((100 * completedLessons) / totalLessons) : 0;
      const submittedTaskIds = new Set(
        submissions
          .filter((s) => s.profile_id === m.profile_id && taskTitleByBlock.has(s.content_block_id))
          .map((s) => s.content_block_id),
      );
      const lastActivity = activity
        .filter((a) => a.profile_id === m.profile_id)
        .reduce<string | null>((max, a) => (max === null || a.updated_at > max ? a.updated_at : max), null);

      return {
        profileId: m.profile_id,
        name: personName(m.profiles),
        percent,
        completedLessons,
        totalLessons,
        openTasks: totalTasks - submittedTaskIds.size,
        trainerSubmissions: trainerVisible.filter((s) => s.profile_id === m.profile_id),
        lastActivity,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  const memberCount = participants.length;
  const avgPercent =
    memberCount > 0
      ? Math.round(participants.reduce((sum, p) => sum + p.percent, 0) / memberCount)
      : 0;
  const openTasksTotal = participants.reduce((sum, p) => sum + p.openTasks, 0);
  const nameByProfile = new Map(participants.map((p) => [p.profileId, p.name]));

  /* ------------------------------- Feedback ----------------------------- */

  let feedback: FeedbackRow[] = [];
  if (trainerVisible.length > 0) {
    const { data: fbData } = await admin
      .from("trainer_feedback")
      .select("id, submission_id, body, created_at, author_profile_id")
      .in(
        "submission_id",
        trainerVisible.map((s) => s.id),
      )
      .order("created_at", { ascending: true });
    feedback = (fbData ?? []) as unknown as FeedbackRow[];
  }

  /* ----------------------------- Teilnehmerliste ------------------------ */

  const columns: Array<DataTableColumn<ParticipantStats>> = [
    {
      key: "name",
      header: "Teilnehmer",
      render: (p) => <span className="font-bold text-ink">{p.name}</span>,
    },
    {
      key: "percent",
      header: "Fortschritt",
      className: "w-48",
      render: (p) => (
        <div>
          <p className="mb-1 text-xs font-bold tabular-nums text-ink">{p.percent} %</p>
          <ProgressBar percent={p.percent} label={`Fortschritt von ${p.name}: ${p.percent} Prozent`} />
        </div>
      ),
    },
    {
      key: "lessons",
      header: "Lektionen",
      className: "whitespace-nowrap",
      render: (p) => (
        <span className="tabular-nums">
          {p.completedLessons} von {p.totalLessons} abgeschlossen
        </span>
      ),
    },
    {
      key: "openTasks",
      header: "Offene Aufgaben",
      className: "whitespace-nowrap",
      render: (p) =>
        p.openTasks > 0 ? (
          <span className="tabular-nums">{p.openTasks}</span>
        ) : (
          <Badge tone="success">Keine offen</Badge>
        ),
    },
    {
      key: "submissions",
      header: "Traineraufgaben",
      render: (p) =>
        p.trainerSubmissions.length === 0 ? (
          <span className="text-ink-soft">Keine eingereicht</span>
        ) : (
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <span className="tabular-nums">{p.trainerSubmissions.length} eingereicht</span>
            {p.trainerSubmissions.some((s) => s.status === "submitted") ? (
              <Badge tone="warning">
                {p.trainerSubmissions.filter((s) => s.status === "submitted").length} neu
              </Badge>
            ) : null}
          </span>
        ),
    },
    {
      key: "activity",
      header: "Letzte Aktivität",
      className: "whitespace-nowrap",
      render: (p) =>
        p.lastActivity !== null ? (
          <span className="tabular-nums">{formatDate(p.lastActivity)}</span>
        ) : (
          <span className="text-ink-soft">Noch keine</span>
        ),
    },
  ];

  const teilnehmerTab = (
    <DataTable
      columns={columns}
      rows={participants}
      rowKey={(p) => p.profileId}
      caption={`Teilnehmer der Gruppe ${cohort.name} mit Fortschritt und offenen Aufgaben`}
      empty={
        <EmptyState
          title="Noch keine Teilnehmer"
          description="Sobald Teilnehmer der Gruppe zugeordnet sind, erscheint hier ihr Fortschritt."
        />
      }
    />
  );

  /* --------------------------- Abgaben & Feedback ----------------------- */

  const fehler = firstString(sp.fehler);

  const abgabenTab = (
    <div className="space-y-4">
      {fehler !== undefined ? (
        <p
          role="alert"
          className="rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {fehler === "recht" ? ERROR_MESSAGES.forbidden : ERROR_MESSAGES.save}
        </p>
      ) : null}

      <p className="text-sm text-ink-soft">
        Hier erscheinen nur Abgaben, die Teilnehmer bewusst für Trainer freigegeben haben.
        Private Abgaben und Reflexionen bleiben privat.
      </p>

      {trainerVisible.length === 0 ? (
        <EmptyState
          title="Noch keine Abgabe für Trainer freigegeben"
          description="Sobald Teilnehmer Transferaufgaben mit Trainer-Sichtbarkeit einreichen, können Sie sie hier sichten und Feedback geben."
        />
      ) : (
        <ul className="space-y-4">
          {trainerVisible.map((s) => {
            const task = taskTitleByBlock.get(s.content_block_id);
            const meta = STATUS_META[s.status];
            const fb = feedback.filter((f) => f.submission_id === s.id);
            return (
              <li key={s.id} className="rounded border border-line bg-white">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
                  <div>
                    <h3 className="text-base font-bold text-ink">
                      {task?.title ?? "Transferaufgabe"}
                    </h3>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {task?.moduleLabel ?? "Aufgabe"} ·{" "}
                      {nameByProfile.get(s.profile_id) ?? "Teilnehmer"} · eingereicht am{" "}
                      {formatDateTime(s.submitted_at)}
                    </p>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>

                <div className="space-y-4 px-5 py-4">
                  {s.note_text !== null && s.note_text.trim() !== "" ? (
                    <p className="whitespace-pre-line text-sm text-ink">{s.note_text}</p>
                  ) : null}
                  {s.file_path !== null ? (
                    <p className="text-sm text-ink-soft">
                      Zur Abgabe gehört eine Datei. Sie ist in der App des Teilnehmerbereichs
                      hinterlegt.
                    </p>
                  ) : null}

                  {fb.length > 0 ? (
                    <div className="space-y-2 rounded bg-paper p-4">
                      <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">
                        Bisheriges Feedback
                      </p>
                      {fb.map((f) => (
                        <div key={f.id}>
                          <p className="whitespace-pre-line text-sm text-ink">{f.body}</p>
                          <p className="mt-0.5 text-xs text-ink-soft">
                            {formatDateTime(f.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {mayFeedback ? (
                    <>
                      <FeedbackForm submissionId={s.id} cohortId={cohort.id} />
                      <div className="flex flex-wrap gap-3 border-t border-line pt-4">
                        {s.status === "submitted" ? (
                          <form action={markSubmissionAction}>
                            <input type="hidden" name="submissionId" value={s.id} />
                            <input type="hidden" name="cohortId" value={cohort.id} />
                            <input type="hidden" name="status" value="seen" />
                            <button
                              type="submit"
                              className="inline-flex min-h-touch items-center rounded border border-ink bg-white px-4 text-sm font-bold uppercase tracking-kicker text-ink hover:bg-paper"
                            >
                              Als gesehen markieren
                            </button>
                          </form>
                        ) : null}
                        {s.status !== "done" ? (
                          <form action={markSubmissionAction}>
                            <input type="hidden" name="submissionId" value={s.id} />
                            <input type="hidden" name="cohortId" value={cohort.id} />
                            <input type="hidden" name="status" value="done" />
                            <button
                              type="submit"
                              className="inline-flex min-h-touch items-center rounded border border-ink bg-white px-4 text-sm font-bold uppercase tracking-kicker text-ink hover:bg-paper"
                            >
                              Als erledigt markieren
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  /* -------------------------------- Render ------------------------------ */

  const defaultTab = firstString(sp.tab) === "abgaben" ? "abgaben" : "teilnehmer";

  return (
    <>
      <PageHeader
        kicker={cohort.organizations?.name ?? "Auswertung"}
        title={cohort.name}
        description={cohort.programs?.title ?? undefined}
        actions={
          <Link
            href="/auswertung"
            className="inline-flex min-h-touch items-center rounded px-4 text-sm font-bold uppercase tracking-kicker text-ink-soft hover:bg-paper hover:text-ink"
          >
            Andere Gruppe wählen
          </Link>
        }
      />

      {/* Kennzahlen der Gruppe */}
      <dl className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded border border-line bg-white p-5">
          <dt className="text-xs font-bold uppercase tracking-kicker text-ink-soft">
            Teilnehmer
          </dt>
          <dd className="mt-1 text-3xl font-extrabold tabular-nums text-ink">{memberCount}</dd>
        </div>
        <div className="rounded border border-line bg-white p-5">
          <dt className="text-xs font-bold uppercase tracking-kicker text-ink-soft">
            Ø-Fortschritt
          </dt>
          <dd className="mt-1 text-3xl font-extrabold tabular-nums text-ink">{avgPercent} %</dd>
        </div>
        <div className="rounded border border-line bg-white p-5">
          <dt className="text-xs font-bold uppercase tracking-kicker text-ink-soft">
            Offene Aufgaben
          </dt>
          <dd className="mt-1 text-3xl font-extrabold tabular-nums text-ink">{openTasksTotal}</dd>
        </div>
      </dl>

      {/* Modul-Fortschritt: x von y haben das Modul abgeschlossen */}
      <section aria-labelledby="modul-fortschritt" className="mb-10">
        <h2
          id="modul-fortschritt"
          className="mb-3 text-lg font-extrabold uppercase tracking-tight text-ink"
        >
          Fortschritt je Modul
        </h2>
        {modules.length === 0 ? (
          <EmptyState title="Das Programm hat noch keine Module" />
        ) : (
          <ul className="space-y-3">
            {modules.map((m) => {
              const rows = progress.filter((p) => p.module_id === m.id);
              const completed = rows.filter(
                (p) => p.total_lessons > 0 && p.completed_lessons === p.total_lessons,
              ).length;
              const percent = memberCount > 0 ? (100 * completed) / memberCount : 0;
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-5 rounded border border-line bg-white px-5 py-4"
                >
                  <span
                    aria-hidden="true"
                    className="w-14 shrink-0 text-3xl font-extrabold tabular-nums leading-none text-green-deep"
                  >
                    {m.number_label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-bold text-ink">{m.title}</p>
                      <p className="text-sm tabular-nums text-ink-soft">
                        {completed} von {memberCount} abgeschlossen
                      </p>
                    </div>
                    <ProgressBar
                      percent={percent}
                      label={`Modul ${m.number_label} ${m.title}: ${completed} von ${memberCount} Teilnehmern abgeschlossen`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Tabs
        defaultTabId={defaultTab}
        tabs={[
          { id: "teilnehmer", label: "Teilnehmer", content: teilnehmerTab },
          { id: "abgaben", label: "Abgaben & Feedback", content: abgabenTab },
        ]}
      />
    </>
  );
}
