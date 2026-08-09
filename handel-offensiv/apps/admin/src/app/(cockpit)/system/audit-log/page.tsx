import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { Badge, DataTable, EmptyState, ErrorState, PageHeader } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * SYSTEM / AUDIT LOG: Revisionslog aller privilegierten Operationen.
 * audit_logs hat bewusst KEINE Client-SELECT-Policies – gelesen wird hier
 * ueber den Service-Role-Client, NACH erneuter Super-Admin-Pruefung.
 * Filter: Aktion (Praefix/Teiltext) + Zeitraum; Metadata je Zeile aufklappbar.
 */

const PAGE_SIZE = 50;

const filterSchema = z.object({
  aktion: z.string().trim().max(120).optional(),
  von: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  bis: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  seite: z.coerce.number().int().min(1).max(10_000).default(1),
});

interface AuditRow {
  id: string;
  actor_profile_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

function firstString(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s !== undefined && s.trim() !== "" ? s : undefined;
}

/** Mitternacht des Kalendertags (Europe/Berlin) als UTC-ISO-String. */
function berlinMidnightUtc(date: string, plusDays = 0): string {
  // Offset (CET +1 / CEST +2) zum fraglichen Datum per Probe um 12:00 UTC
  const probe = new Date(`${date}T12:00:00Z`);
  const berlinHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Berlin",
      hour12: false,
      hour: "2-digit",
    }).format(probe),
  );
  const offsetHours = (berlinHour - 12 + 24) % 24; // Berlin liegt immer vor UTC
  const utcMs = Date.parse(`${date}T00:00:00Z`) - offsetHours * 3_600_000 + plusDays * 86_400_000;
  return new Date(utcMs).toISOString();
}

function buildHref(
  filters: { aktion?: string; von?: string; bis?: string },
  page: number,
): string {
  const params = new URLSearchParams();
  if (filters.aktion !== undefined) params.set("aktion", filters.aktion);
  if (filters.von !== undefined) params.set("von", filters.von);
  if (filters.bis !== undefined) params.set("bis", filters.bis);
  if (page > 1) params.set("seite", String(page));
  const qs = params.toString();
  return qs === "" ? "/system/audit-log" : `/system/audit-log?${qs}`;
}

const TARGET_LABELS: Record<string, string> = {
  invitation: "Einladung",
  profile: "Profil",
  organization: "Organisation",
  organization_membership: "Mitgliedschaft",
  cohort: "Gruppe",
  cohort_session: "Termin",
  program: "Programm",
  module: "Modul",
  lesson: "Lektion",
  content_block: "Inhaltsblock",
  quiz: "Quiz",
  announcement: "Ankündigung",
  submission: "Abgabe",
  mfa_factor: "MFA-Faktor",
};

export default async function AuditLogPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const session = await getActorContext();
  if (!session) redirect("/login");
  if (!session.actor.isSuperAdmin) {
    return <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />;
  }

  const parsed = filterSchema.safeParse({
    aktion: firstString(sp.aktion),
    von: firstString(sp.von),
    bis: firstString(sp.bis),
    seite: firstString(sp.seite) ?? 1,
  });
  const filters = parsed.success
    ? parsed.data
    : { aktion: undefined, von: undefined, bis: undefined, seite: 1 };

  const admin = createSupabaseAdminClient();

  let query = admin
    .from("audit_logs")
    .select("id, actor_profile_id, action, target_type, target_id, metadata, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (filters.aktion !== undefined) query = query.ilike("action", `%${filters.aktion}%`);
  if (filters.von !== undefined) query = query.gte("created_at", berlinMidnightUtc(filters.von));
  if (filters.bis !== undefined) query = query.lt("created_at", berlinMidnightUtc(filters.bis, 1));

  const from = (filters.seite - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);

  if (error) {
    return (
      <>
        <PageHeader kicker="System" title="Audit Log" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }

  const rows = (data ?? []) as unknown as AuditRow[];
  const total = count ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Akteursnamen in EINER Abfrage aufloesen
  const actorIds = [...new Set(rows.map((r) => r.actor_profile_id).filter((v): v is string => v !== null))];
  const actorNames = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: actors } = await admin
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", actorIds);
    for (const a of (actors ?? []) as Array<{
      id: string;
      first_name: string | null;
      last_name: string | null;
    }>) {
      const name = [a.first_name, a.last_name].filter(Boolean).join(" ").trim();
      if (name !== "") actorNames.set(a.id, name);
    }
  }

  const columns: Array<DataTableColumn<AuditRow>> = [
    {
      key: "time",
      header: "Zeit",
      className: "whitespace-nowrap align-top",
      render: (r) => <span className="tabular-nums">{formatDateTime(r.created_at)}</span>,
    },
    {
      key: "actor",
      header: "Akteur",
      className: "align-top",
      render: (r) =>
        r.actor_profile_id === null ? (
          <Badge>System</Badge>
        ) : (
          <span>{actorNames.get(r.actor_profile_id) ?? "Unbekanntes Konto"}</span>
        ),
    },
    {
      key: "action",
      header: "Aktion",
      className: "align-top",
      render: (r) => <code className="font-mono text-xs text-ink">{r.action}</code>,
    },
    {
      key: "target",
      header: "Ziel",
      className: "align-top",
      render: (r) =>
        r.target_type === null ? (
          <span className="text-ink-soft">–</span>
        ) : (
          <div>
            <p>{TARGET_LABELS[r.target_type] ?? r.target_type}</p>
            {r.target_id !== null ? (
              <p className="font-mono text-xs text-ink-soft" title={r.target_id}>
                {r.target_id.slice(0, 8)}…
              </p>
            ) : null}
          </div>
        ),
    },
    {
      key: "metadata",
      header: "Details",
      className: "align-top",
      render: (r) =>
        Object.keys(r.metadata).length === 0 ? (
          <span className="text-ink-soft">–</span>
        ) : (
          <details className="group">
            <summary className="inline-flex min-h-touch cursor-pointer list-none items-center rounded px-2 text-xs font-bold uppercase tracking-kicker text-green-deep hover:bg-paper">
              <span className="group-open:hidden">Aufklappen</span>
              <span className="hidden group-open:inline">Zuklappen</span>
            </summary>
            <pre className="mt-2 max-w-md overflow-x-auto rounded border border-line bg-paper p-3 font-mono text-xs text-ink">
              {JSON.stringify(r.metadata, null, 2)}
            </pre>
          </details>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        kicker="System"
        title="Audit Log"
        description={`Revisionslog aller privilegierten Operationen (${total} ${total === 1 ? "Eintrag" : "Einträge"}). Einträge werden ausschließlich angefügt und sind nicht veränderbar.`}
      />

      {/* Filter (GET-Formular, ohne JavaScript bedienbar) */}
      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-3 rounded border border-line bg-white p-4"
      >
        <div>
          <label htmlFor="filter-aktion" className="mb-1.5 block text-sm font-bold text-ink">
            Aktion
          </label>
          <input
            id="filter-aktion"
            name="aktion"
            type="text"
            defaultValue={filters.aktion ?? ""}
            placeholder="z. B. invitations"
            className="block min-h-touch min-w-48 rounded border border-line bg-white px-3 text-base text-ink focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep"
          />
        </div>
        <div>
          <label htmlFor="filter-von" className="mb-1.5 block text-sm font-bold text-ink">
            Von
          </label>
          <input
            id="filter-von"
            name="von"
            type="date"
            defaultValue={filters.von ?? ""}
            className="block min-h-touch rounded border border-line bg-white px-3 text-base text-ink focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep"
          />
        </div>
        <div>
          <label htmlFor="filter-bis" className="mb-1.5 block text-sm font-bold text-ink">
            Bis (einschließlich)
          </label>
          <input
            id="filter-bis"
            name="bis"
            type="date"
            defaultValue={filters.bis ?? ""}
            className="block min-h-touch rounded border border-line bg-white px-3 text-base text-ink focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep"
          />
        </div>
        <button
          type="submit"
          className="inline-flex min-h-touch items-center rounded bg-green px-5 text-sm font-bold uppercase tracking-kicker text-dark hover:bg-green-bright"
        >
          Filtern
        </button>
        {filters.aktion !== undefined || filters.von !== undefined || filters.bis !== undefined ? (
          <Link
            href="/system/audit-log"
            className="inline-flex min-h-touch items-center rounded px-3 text-sm font-bold uppercase tracking-kicker text-ink-soft hover:bg-paper hover:text-ink"
          >
            Zurücksetzen
          </Link>
        ) : null}
      </form>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        caption="Revisionslog privilegierter Operationen"
        empty={
          <EmptyState
            title="Keine Einträge gefunden"
            description="Für den gewählten Filter liegen keine Audit-Einträge vor."
          />
        }
        pagination={{
          page: filters.seite,
          pageCount,
          hrefForPage: (p) =>
            buildHref({ aktion: filters.aktion, von: filters.von, bis: filters.bis }, p),
        }}
      />
    </>
  );
}
