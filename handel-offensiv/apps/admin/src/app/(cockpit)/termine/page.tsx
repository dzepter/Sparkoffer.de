import Link from "next/link";

import { Badge, DataTable, EmptyState, ErrorState, PageHeader } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { formatDateTime, formatTime } from "@/lib/datetime";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * TERMINE (§18/§55): Globale Terminuebersicht ueber alle Gruppen.
 * Lesend im Nutzer-Kontext (RLS): Trainer sehen automatisch nur die Termine
 * ihrer Gruppen, Org-Admins die ihrer Organisation, Super Admins alles.
 * Die Verwaltung (Anlegen/Bearbeiten) liegt in der jeweiligen Gruppe.
 */

interface SessionRow {
  id: string;
  cohort_id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  venue: string | null;
  room: string | null;
  cohorts: {
    name: string;
    organization_id: string;
    organizations: { name: string } | null;
  } | null;
  modules: { number_label: string; title: string } | null;
}

interface CohortOption {
  id: string;
  name: string;
  organization_id: string;
  organizations: { name: string } | null;
}

function firstString(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s !== undefined && s !== "" ? s : undefined;
}

function locationLabel(r: SessionRow): string {
  const parts = [r.venue, r.room].filter((p): p is string => Boolean(p && p.trim()));
  return parts.length > 0 ? parts.join(", ") : "–";
}

export default async function TerminePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const session = await getActorContext();
  if (!session) return <ErrorState message={ERROR_MESSAGES.sessionExpired} />;

  const orgFilter = firstString(sp.organisation);
  const gruppeFilter = firstString(sp.gruppe);

  const supabase = await createSupabaseServerClient();

  // Filteroptionen: alle fuer den Akteur sichtbaren Gruppen (RLS)
  const cohortsRes = await supabase
    .from("cohorts")
    .select("id, name, organization_id, organizations(name)")
    .order("name");

  if (cohortsRes.error) {
    return (
      <>
        <PageHeader kicker="Programm" title="Termine" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }

  const cohorts = (cohortsRes.data ?? []) as unknown as CohortOption[];
  const organizations = new Map<string, string>();
  for (const c of cohorts) {
    if (c.organizations) organizations.set(c.organization_id, c.organizations.name);
  }

  let query = supabase
    .from("cohort_sessions")
    .select(
      "id, cohort_id, title, starts_at, ends_at, venue, room, cohorts!inner(name, organization_id, organizations(name)), modules(number_label, title)",
    )
    .order("starts_at", { ascending: true });

  if (gruppeFilter !== undefined) query = query.eq("cohort_id", gruppeFilter);
  if (orgFilter !== undefined) query = query.eq("cohorts.organization_id", orgFilter);

  const { data, error } = await query;
  if (error) {
    return (
      <>
        <PageHeader kicker="Programm" title="Termine" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }

  const all = (data ?? []) as unknown as SessionRow[];
  const nowIso = new Date().toISOString();
  const upcoming = all.filter((s) => (s.ends_at ?? s.starts_at) >= nowIso);
  const past = all.filter((s) => (s.ends_at ?? s.starts_at) < nowIso).reverse();

  const columns: Array<DataTableColumn<SessionRow>> = [
    {
      key: "start",
      header: "Beginn",
      className: "whitespace-nowrap",
      render: (r) => (
        <span className="tabular-nums">
          {formatDateTime(r.starts_at)}
          {r.ends_at ? ` – ${formatTime(r.ends_at)}` : ""}
        </span>
      ),
    },
    {
      key: "title",
      header: "Termin",
      render: (r) => (
        <div>
          <p className="font-bold text-ink">{r.title}</p>
          {r.modules ? (
            <p className="text-xs text-ink-soft">
              Modul {r.modules.number_label} · {r.modules.title}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "cohort",
      header: "Gruppe",
      render: (r) =>
        r.cohorts ? (
          <div>
            <p>{r.cohorts.name}</p>
            {r.cohorts.organizations ? (
              <p className="text-xs text-ink-soft">{r.cohorts.organizations.name}</p>
            ) : null}
          </div>
        ) : (
          <span className="text-ink-soft">–</span>
        ),
    },
    { key: "location", header: "Ort", render: (r) => locationLabel(r) },
    {
      key: "actions",
      header: "Aktionen",
      className: "whitespace-nowrap text-right",
      render: (r) => (
        <span className="inline-flex items-center gap-3">
          <a
            href={`/termine/${r.id}/ics`}
            className="inline-flex min-h-touch items-center rounded px-2 text-xs font-bold uppercase tracking-kicker text-green-deep hover:bg-paper"
            aria-label={`Termin „${r.title}“ als Kalenderdatei herunterladen`}
          >
            ICS-Export
          </a>
          <Link
            href={`/gruppen/${r.cohort_id}?tab=termine`}
            className="inline-flex min-h-touch items-center rounded px-2 text-xs font-bold uppercase tracking-kicker text-ink-soft hover:bg-paper hover:text-ink"
          >
            Zur Gruppe
          </Link>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        kicker="Programm"
        title="Termine"
        description="Alle Präsenztermine im Überblick. Angelegt und bearbeitet werden Termine in der jeweiligen Gruppe."
      />

      {/* Filter (GET-Formular, ohne JavaScript bedienbar) */}
      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-3 rounded border border-line bg-white p-4"
      >
        <div>
          <label htmlFor="filter-org" className="mb-1.5 block text-sm font-bold text-ink">
            Organisation
          </label>
          <select
            id="filter-org"
            name="organisation"
            defaultValue={orgFilter ?? ""}
            className="block min-h-touch min-w-48 rounded border border-line bg-white px-3 text-base text-ink focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep"
          >
            <option value="">Alle Organisationen</option>
            {[...organizations.entries()].map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-gruppe" className="mb-1.5 block text-sm font-bold text-ink">
            Gruppe
          </label>
          <select
            id="filter-gruppe"
            name="gruppe"
            defaultValue={gruppeFilter ?? ""}
            className="block min-h-touch min-w-48 rounded border border-line bg-white px-3 text-base text-ink focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep"
          >
            <option value="">Alle Gruppen</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.organizations ? ` (${c.organizations.name})` : ""}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex min-h-touch items-center rounded bg-green px-5 text-sm font-bold uppercase tracking-kicker text-dark hover:bg-green-bright"
        >
          Filtern
        </button>
        {orgFilter !== undefined || gruppeFilter !== undefined ? (
          <Link
            href="/termine"
            className="inline-flex min-h-touch items-center rounded px-3 text-sm font-bold uppercase tracking-kicker text-ink-soft hover:bg-paper hover:text-ink"
          >
            Zurücksetzen
          </Link>
        ) : null}
      </form>

      <section aria-labelledby="kommende-termine" className="mb-10">
        <div className="mb-3 flex items-center gap-3">
          <h2 id="kommende-termine" className="text-lg font-extrabold uppercase tracking-tight text-ink">
            Kommende Termine
          </h2>
          <Badge tone="brand">{upcoming.length}</Badge>
        </div>
        <DataTable
          columns={columns}
          rows={upcoming}
          rowKey={(r) => r.id}
          caption="Liste der kommenden Präsenztermine"
          empty={
            <EmptyState
              title="Keine kommenden Termine"
              description="Neue Termine legen Sie in der jeweiligen Gruppe unter „Termine“ an."
            />
          }
        />
      </section>

      <section aria-labelledby="vergangene-termine">
        <div className="mb-3 flex items-center gap-3">
          <h2
            id="vergangene-termine"
            className="text-lg font-extrabold uppercase tracking-tight text-ink"
          >
            Vergangene Termine
          </h2>
          <Badge>{past.length}</Badge>
        </div>
        <DataTable
          columns={columns}
          rows={past}
          rowKey={(r) => r.id}
          caption="Liste der vergangenen Präsenztermine"
          empty={<EmptyState title="Noch keine vergangenen Termine" />}
        />
      </section>
    </>
  );
}
