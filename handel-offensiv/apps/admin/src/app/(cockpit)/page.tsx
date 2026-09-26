import Link from "next/link";

import type { CohortRow, CohortSessionRow, LessonRow } from "@handel-offensiv/types";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate, formatTime, todayRangeBerlin } from "@/lib/datetime";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * ÜBERSICHT (§20): Betriebszustand auf einen Blick – aktive Unternehmen,
 * Gruppen, Teilnehmer, offene Einladungen; heute relevante Termine, zuletzt
 * veroeffentlichte Inhalte, laufende Gruppen. Keine Vanity Metrics.
 * Alle Zugriffe im Nutzerkontext (RLS wirksam).
 */

export const dynamic = "force-dynamic";

type CountResult = { count: number | null; error: unknown };

function StatTile({
  label,
  value,
  href,
  error,
}: {
  label: string;
  value: number | null;
  href: string;
  error: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded border border-line bg-white p-5 transition-colors hover:border-green-deep"
    >
      <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">{label}</p>
      {error ? (
        <p className="mt-2 text-sm text-ink-soft">Konnte nicht geladen werden</p>
      ) : (
        <p className="mt-1 text-4xl font-extrabold tracking-tight text-ink group-hover:text-green-deep">
          {value ?? 0}
        </p>
      )}
    </Link>
  );
}

export default async function UebersichtPage() {
  const supabase = await createSupabaseServerClient();
  const nowIso = new Date().toISOString();
  const today = todayRangeBerlin();
  const todayDate = today.date;

  const [
    orgCount,
    cohortCount,
    participantCount,
    openInvitationCount,
    overdueInvitationCount,
    sessionsRes,
    lessonsRes,
    runningCohortsRes,
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("status", "active") as unknown as Promise<CountResult>,
    supabase
      .from("cohorts")
      .select("id", { count: "exact", head: true })
      .eq("status", "active") as unknown as Promise<CountResult>,
    supabase
      .from("organization_memberships")
      .select("id", { count: "exact", head: true })
      .eq("role", "participant")
      .eq("status", "active") as unknown as Promise<CountResult>,
    supabase
      .from("invitations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .gt("expires_at", nowIso) as unknown as Promise<CountResult>,
    supabase
      .from("invitations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lte("expires_at", nowIso) as unknown as Promise<CountResult>,
    supabase
      .from("cohort_sessions")
      .select("id, title, starts_at, ends_at, venue, room, cohort_id")
      .gte("starts_at", today.start)
      .lt("starts_at", today.end)
      .order("starts_at", { ascending: true })
      .limit(8),
    supabase
      .from("lessons")
      .select("id, title, published_at, status")
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(5),
    supabase
      .from("cohorts")
      .select("id, name, start_date, end_date, status")
      .eq("status", "active")
      .lte("start_date", todayDate)
      .gte("end_date", todayDate)
      .order("end_date", { ascending: true })
      .limit(8),
  ]);

  const sessions = (sessionsRes.data ?? []) as Array<
    Pick<CohortSessionRow, "id" | "title" | "starts_at" | "ends_at" | "venue" | "room" | "cohort_id">
  >;
  const lessons = (lessonsRes.data ?? []) as Array<
    Pick<LessonRow, "id" | "title" | "published_at" | "status">
  >;
  const runningCohorts = (runningCohortsRes.data ?? []) as Array<
    Pick<CohortRow, "id" | "name" | "start_date" | "end_date" | "status">
  >;

  const overdue = overdueInvitationCount.error ? 0 : (overdueInvitationCount.count ?? 0);

  return (
    <>
      <PageHeader
        kicker="Cockpit"
        title="Übersicht"
        description="Der aktuelle Stand über alle Unternehmen, Gruppen und Programme hinweg."
      />

      {overdue > 0 ? (
        <div
          role="status"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded border border-warning/40 bg-warning/10 px-4 py-3"
        >
          <p className="text-sm text-ink">
            <span className="font-bold">
              {overdue} {overdue === 1 ? "Einladung ist" : "Einladungen sind"} abgelaufen
            </span>{" "}
            und wurde{overdue === 1 ? "" : "n"} nicht angenommen. Bitte prüfen und ggf. erneut
            einladen.
          </p>
          <Link
            href="/teilnehmer"
            className="text-sm font-bold uppercase tracking-kicker text-green-deep hover:underline"
          >
            Zu den Teilnehmern
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Aktive Unternehmen"
          value={orgCount.count}
          error={Boolean(orgCount.error)}
          href="/unternehmen"
        />
        <StatTile
          label="Aktive Gruppen"
          value={cohortCount.count}
          error={Boolean(cohortCount.error)}
          href="/gruppen"
        />
        <StatTile
          label="Teilnehmer"
          value={participantCount.count}
          error={Boolean(participantCount.error)}
          href="/teilnehmer"
        />
        <StatTile
          label="Offene Einladungen"
          value={openInvitationCount.count}
          error={Boolean(openInvitationCount.error)}
          href="/teilnehmer"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Heute relevante Termine">
          {sessionsRes.error ? (
            <ErrorState message={ERROR_MESSAGES.load} />
          ) : sessions.length === 0 ? (
            <EmptyState
              title="Heute keine Termine"
              description="Für heute ist kein Präsenztermin geplant."
            />
          ) : (
            <ul className="divide-y divide-line/60">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-baseline gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="w-24 shrink-0 text-sm font-bold text-green-deep">
                    {formatTime(s.starts_at)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">{s.title}</span>
                    {s.venue || s.room ? (
                      <span className="block truncate text-xs text-ink-soft">
                        {[s.venue, s.room].filter(Boolean).join(" · ")}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Kürzlich veröffentlicht">
          {lessonsRes.error ? (
            <ErrorState message={ERROR_MESSAGES.load} />
          ) : lessons.length === 0 ? (
            <EmptyState
              title="Noch nichts veröffentlicht"
              description="Sobald Lektionen veröffentlicht werden, erscheinen sie hier."
            />
          ) : (
            <ul className="divide-y divide-line/60">
              {lessons.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">{l.title}</span>
                    {l.published_at ? (
                      <span className="block text-xs text-ink-soft">
                        Veröffentlicht am {formatDate(l.published_at)}
                      </span>
                    ) : null}
                  </span>
                  <Badge tone="success">Veröffentlicht</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Laufende Gruppen">
          {runningCohortsRes.error ? (
            <ErrorState message={ERROR_MESSAGES.load} />
          ) : runningCohorts.length === 0 ? (
            <EmptyState
              title="Keine laufende Gruppe"
              description="Aktuell befindet sich keine Gruppe im Programmzeitraum."
            />
          ) : (
            <ul className="divide-y divide-line/60">
              {runningCohorts.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">{c.name}</span>
                    {c.start_date && c.end_date ? (
                      <span className="block text-xs text-ink-soft">
                        {formatDate(c.start_date)} – {formatDate(c.end_date)}
                      </span>
                    ) : null}
                  </span>
                  <Badge tone="brand">Läuft</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
