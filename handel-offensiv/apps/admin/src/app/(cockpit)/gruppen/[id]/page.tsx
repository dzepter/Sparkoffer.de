import Link from "next/link";

import { can } from "@handel-offensiv/domain";
import type {
  CohortRow,
  CohortSessionRow,
  LessonReleaseRow,
  MemberStatus,
  OrgStatus,
} from "@handel-offensiv/types";

import { Badge, Button, EmptyState, ErrorState, PageHeader, Tabs } from "@/components/ui";
import type { BadgeTone, TabItem } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { formatDate } from "@/lib/datetime";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assignTrainerAction, removeTrainerAction } from "../actions";
import { ReleaseEditor, type ReleaseModule, type ReleaseSessionOption } from "./release-editor";
import { SessionsTab, type ModuleOption, type TrainerOption } from "./sessions-tab";

export const dynamic = "force-dynamic";

/** Detailseite einer Gruppe: Tabs Mitglieder / Termine / Freischaltungen. */

const STATUS_META: Record<OrgStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "Aktiv", tone: "success" },
  inactive: { label: "Inaktiv", tone: "warning" },
  archived: { label: "Archiviert", tone: "neutral" },
};

const MEMBER_STATUS: Record<MemberStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "Aktiv", tone: "success" },
  inactive: { label: "Inaktiv", tone: "neutral" },
};

interface ProfileName {
  first_name: string | null;
  last_name: string | null;
}
interface MemberRowData {
  id: string;
  status: MemberStatus;
  created_at: string;
  profiles: ProfileName | null;
}
interface TrainerRowData {
  id: string;
  profile_id: string;
  profiles: ProfileName | null;
}
interface CandidateRow {
  profile_id: string;
  profiles: ProfileName | null;
}
interface ModuleWithContent {
  id: string;
  number_label: string;
  title: string;
  position: number;
  learning_phases: Array<{
    id: string;
    title: string;
    position: number;
    lessons: Array<{ id: string; title: string; position: number; status: string }>;
  }>;
}

function personName(p: ProfileName | null): string {
  const n = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
  return n.length > 0 ? n : "Ohne Namen";
}

export default async function GruppeDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const session = await getActorContext();
  if (!session) return <ErrorState message={ERROR_MESSAGES.sessionExpired} />;
  const { actor } = session;

  if (!can(actor, "cohorts.read")) {
    return <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />;
  }
  const manage = can(actor, "cohorts.manage");

  const supabase = await createSupabaseServerClient();
  const { data: cohortData, error: cohortError } = await supabase
    .from("cohorts")
    .select("*, organizations(name), programs(title)")
    .eq("id", id)
    .maybeSingle();

  if (cohortError) return <ErrorState message={ERROR_MESSAGES.load} />;
  if (!cohortData) return <ErrorState title="Nicht gefunden" message={ERROR_MESSAGES.notFound} />;

  const cohort = cohortData as CohortRow & {
    organizations: { name: string } | null;
    programs: { title: string } | null;
  };

  const [membersRes, trainersRes, candidatesRes, sessionsRes, modulesRes, releasesRes] =
    await Promise.all([
      supabase
        .from("cohort_members")
        .select("id, status, created_at, profiles(first_name, last_name)")
        .eq("cohort_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("cohort_trainers")
        .select("id, profile_id, profiles(first_name, last_name)")
        .eq("cohort_id", id),
      supabase
        .from("organization_memberships")
        .select("profile_id, profiles(first_name, last_name)")
        .eq("organization_id", cohort.organization_id)
        .eq("role", "trainer")
        .eq("status", "active"),
      supabase
        .from("cohort_sessions")
        .select("*")
        .eq("cohort_id", id)
        .order("starts_at", { ascending: true }),
      supabase
        .from("modules")
        .select(
          "id, number_label, title, position, learning_phases(id, title, position, lessons(id, title, position, status))",
        )
        .eq("program_id", cohort.program_id),
      supabase.from("lesson_releases").select("*").eq("cohort_id", id).is("profile_id", null),
    ]);

  const loadError =
    membersRes.error ??
    trainersRes.error ??
    candidatesRes.error ??
    sessionsRes.error ??
    modulesRes.error ??
    releasesRes.error;

  const members = (membersRes.data ?? []) as unknown as MemberRowData[];
  const trainers = (trainersRes.data ?? []) as unknown as TrainerRowData[];
  const candidates = (candidatesRes.data ?? []) as unknown as CandidateRow[];
  const sessions = (sessionsRes.data ?? []) as CohortSessionRow[];
  const releases = (releasesRes.data ?? []) as LessonReleaseRow[];

  const modules: ReleaseModule[] = ((modulesRes.data ?? []) as unknown as ModuleWithContent[])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((m) => ({
      id: m.id,
      numberLabel: m.number_label,
      title: m.title,
      lessons: m.learning_phases
        .slice()
        .sort((a, b) => a.position - b.position)
        .flatMap((phase) =>
          phase.lessons
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((l) => ({ id: l.id, title: l.title, phaseTitle: phase.title })),
        ),
    }));

  const moduleOptions: ModuleOption[] = modules.map((m) => ({
    id: m.id,
    label: `${m.numberLabel} – ${m.title}`,
  }));
  const trainerOptions: TrainerOption[] = candidates.map((c) => ({
    profileId: c.profile_id,
    name: personName(c.profiles),
  }));
  const sessionOptions: ReleaseSessionOption[] = sessions.map((s) => ({
    id: s.id,
    label: `${s.title} (${formatDate(s.starts_at)})`,
  }));

  const assignedIds = new Set(trainers.map((t) => t.profile_id));
  const assignableTrainers = trainerOptions.filter((t) => !assignedIds.has(t.profileId));

  const mitgliederTab = (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-kicker text-ink-soft">Trainer</h2>
        {trainers.length === 0 ? (
          <p className="text-sm text-ink-soft">Dieser Gruppe ist noch kein Trainer zugewiesen.</p>
        ) : (
          <ul className="divide-y divide-line/60 rounded border border-line bg-white">
            {trainers.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <span className="text-sm font-bold text-ink">{personName(t.profiles)}</span>
                {manage ? (
                  <form action={removeTrainerAction}>
                    <input type="hidden" name="cohortId" value={id} />
                    <input type="hidden" name="cohortTrainerId" value={t.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Entfernen
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {manage ? (
          assignableTrainers.length > 0 ? (
            <form action={assignTrainerAction} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="cohortId" value={id} />
              <div className="min-w-64">
                <label
                  htmlFor="trainer-select"
                  className="mb-1.5 block text-sm font-bold text-ink"
                >
                  Trainer zuweisen
                </label>
                <select
                  id="trainer-select"
                  name="trainerProfileId"
                  required
                  className="block min-h-touch w-full rounded border border-line bg-white px-3 text-base text-ink focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep"
                >
                  <option value="">Bitte wählen</option>
                  {assignableTrainers.map((t) => (
                    <option key={t.profileId} value={t.profileId}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit">Zuweisen</Button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">
              Kein weiterer Trainer verfügbar. Trainer erhalten ihre Rolle über die
              Teilnehmerverwaltung des Unternehmens.
            </p>
          )
        ) : null}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-kicker text-ink-soft">
          Mitglieder ({members.length})
        </h2>
        {members.length === 0 ? (
          <EmptyState
            title="Noch keine Mitglieder"
            description="Teilnehmer werden über den Bereich Teilnehmer eingeladen oder dieser Gruppe zugeordnet."
            action={
              <Link
                href="/teilnehmer"
                className="inline-flex min-h-touch items-center justify-center rounded bg-green px-5 text-sm font-bold uppercase tracking-kicker text-dark hover:bg-green-bright"
              >
                Zu den Teilnehmern
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-line/60 rounded border border-line bg-white">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink">{personName(m.profiles)}</span>
                  <span className="block text-xs text-ink-soft">
                    Dabei seit {formatDate(m.created_at)}
                  </span>
                </span>
                <Badge tone={MEMBER_STATUS[m.status].tone}>{MEMBER_STATUS[m.status].label}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );

  const tabs: TabItem[] = [
    { id: "mitglieder", label: "Mitglieder", content: mitgliederTab },
    {
      id: "termine",
      label: "Termine",
      content: (
        <SessionsTab
          cohortId={id}
          sessions={sessions}
          modules={moduleOptions}
          trainers={trainerOptions}
          canManage={manage}
        />
      ),
    },
    {
      id: "freischaltungen",
      label: "Freischaltungen",
      content: (
        <ReleaseEditor
          cohortId={id}
          modules={modules}
          sessions={sessionOptions}
          releases={releases}
          canManage={manage}
        />
      ),
    },
  ];

  const tabParam = typeof sp.tab === "string" ? sp.tab : undefined;

  return (
    <>
      <PageHeader
        kicker={cohort.organizations?.name ?? "Gruppe"}
        title={cohort.name}
        description={
          <>
            {cohort.programs?.title ?? "Programm unbekannt"}
            {cohort.start_date && cohort.end_date
              ? ` · ${formatDate(cohort.start_date)} – ${formatDate(cohort.end_date)}`
              : ""}
          </>
        }
        actions={
          <div className="flex items-center gap-3">
            <Badge tone={STATUS_META[cohort.status].tone}>{STATUS_META[cohort.status].label}</Badge>
            {manage ? (
              <Link
                href={`/gruppen/${id}/bearbeiten`}
                className="inline-flex min-h-touch items-center justify-center rounded border border-ink bg-white px-5 text-sm font-bold uppercase tracking-kicker text-ink hover:bg-paper"
              >
                Bearbeiten
              </Link>
            ) : null}
          </div>
        }
      />

      {sp.fehler ? (
        <p role="alert" className="mb-4 rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
          {sp.fehler === "recht" ? ERROR_MESSAGES.forbidden : ERROR_MESSAGES.save}
        </p>
      ) : null}

      {loadError ? (
        <p role="alert" className="mb-4 rounded border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-ink">
          Ein Teil der Daten konnte gerade nicht geladen werden. Bitte laden Sie die Seite neu.
        </p>
      ) : null}

      <Tabs tabs={tabs} defaultTabId={tabParam} />
    </>
  );
}
