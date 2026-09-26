import Link from "next/link";

import { can } from "@handel-offensiv/domain";
import type { InvitationRow, MemberRole, MemberStatus } from "@handel-offensiv/types";

import { Badge, Button, Card, DataTable, EmptyState, ErrorState, PageHeader } from "@/components/ui";
import type { BadgeTone, DataTableColumn } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resendInvitationAction, revokeInvitationAction } from "./actions";
import { loadAuthUserMap } from "./auth-users";
import { RowActions, type CohortOption, type MemberRowInfo } from "./row-actions";

export const dynamic = "force-dynamic";

/**
 * TEILNEHMER (§23): Liste mit Filtern (Organisation/Gruppe/Rolle/Status),
 * Pagination, Einladungsstatus und Aktionen. Kein Hard-Delete.
 */

const PAGE_SIZE = 25;

const ROLE_LABELS: Record<MemberRole, string> = {
  org_admin: "Org-Admin",
  trainer: "Trainer",
  participant: "Teilnehmer",
};

const STATUS_META: Record<MemberStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "Aktiv", tone: "success" },
  inactive: { label: "Inaktiv", tone: "neutral" },
};

interface MembershipQueryRow {
  id: string;
  profile_id: string;
  organization_id: string;
  role: MemberRole;
  status: MemberStatus;
  created_at: string;
  organizations: { name: string } | null;
  profiles: { first_name: string | null; last_name: string | null } | null;
}

interface ListRow extends MemberRowInfo {
  orgName: string;
  cohortNames: string;
  email: string | null;
  lastLogin: string | null;
  invitationLabel: string | null;
}

function str(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function TeilnehmerPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const session = await getActorContext();
  if (!session) return <ErrorState message={ERROR_MESSAGES.sessionExpired} />;
  const { actor } = session;

  if (!can(actor, "users.read")) {
    return <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />;
  }
  const canInvite = can(actor, "users.invite");
  const canManage = can(actor, "users.manage");

  const filter = {
    organisation: str(sp.organisation),
    gruppe: str(sp.gruppe),
    rolle: str(sp.rolle),
    status: str(sp.status),
  };
  const page = Math.max(1, Number.parseInt(str(sp.seite) || "1", 10) || 1);

  const supabase = await createSupabaseServerClient();

  // Auswahllisten fuer Filter + Zeilenaktionen
  const [orgsRes, cohortsRes] = await Promise.all([
    supabase.from("organizations").select("id, name").order("name"),
    supabase.from("cohorts").select("id, name, organization_id").order("name"),
  ]);
  const orgs = (orgsRes.data ?? []) as Array<{ id: string; name: string }>;
  const cohorts = (cohortsRes.data ?? []) as Array<{
    id: string;
    name: string;
    organization_id: string;
  }>;

  // Gruppenfilter: erst die Profil-IDs der Gruppe bestimmen
  let profileFilter: string[] | null = null;
  if (filter.gruppe !== "") {
    const { data } = await supabase
      .from("cohort_members")
      .select("profile_id")
      .eq("cohort_id", filter.gruppe)
      .limit(1000);
    profileFilter = ((data ?? []) as Array<{ profile_id: string }>).map((r) => r.profile_id);
  }

  let query = supabase
    .from("organization_memberships")
    .select(
      "id, profile_id, organization_id, role, status, created_at, organizations(name), profiles(first_name, last_name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (filter.organisation !== "") query = query.eq("organization_id", filter.organisation);
  if (filter.rolle !== "") query = query.eq("role", filter.rolle);
  if (filter.status !== "") query = query.eq("status", filter.status);
  if (profileFilter !== null) {
    query = profileFilter.length > 0 ? query.in("profile_id", profileFilter) : query.in("profile_id", ["00000000-0000-0000-0000-000000000000"]);
  }

  const { data: membershipData, error: membershipError, count } = await query;
  if (membershipError) {
    return (
      <>
        <PageHeader kicker="Verwaltung" title="Teilnehmer" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }

  const memberships = (membershipData ?? []) as unknown as MembershipQueryRow[];
  const profileIds = memberships.map((m) => m.profile_id);

  // Gruppen der angezeigten Profile
  const memberCohortsRes =
    profileIds.length > 0
      ? await supabase
          .from("cohort_members")
          .select("profile_id, cohort_id, cohorts(name, organization_id)")
          .in("profile_id", profileIds)
      : { data: [] as unknown[], error: null };
  const memberCohorts = (memberCohortsRes.data ?? []) as unknown as Array<{
    profile_id: string;
    cohort_id: string;
    cohorts: { name: string; organization_id: string } | null;
  }>;

  // E-Mail + letzter Login aus auth.users (Service-Kontext, nur lesend);
  // bei Fehlern bleibt die Map leer -> Anzeige "n/a".
  const authUsers = await loadAuthUserMap();

  // Offene Einladungen (RLS-lesbar im Nutzerkontext)
  const invitationsRes = await supabase
    .from("invitations")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const pendingInvitations = (invitationsRes.data ?? []) as InvitationRow[];
  const invitationByEmail = new Map<string, InvitationRow>();
  for (const inv of pendingInvitations) invitationByEmail.set(inv.email.toLowerCase(), inv);

  const nowMs = Date.now();

  const rows: ListRow[] = memberships.map((m) => {
    const auth = authUsers.get(m.profile_id);
    const email = auth?.email ?? null;
    const myCohorts = memberCohorts.filter(
      (c) => c.profile_id === m.profile_id && c.cohorts?.organization_id === m.organization_id,
    );
    const invitation = email ? invitationByEmail.get(email.toLowerCase()) : undefined;
    return {
      membershipId: m.id,
      profileId: m.profile_id,
      organizationId: m.organization_id,
      name:
        [m.profiles?.first_name, m.profiles?.last_name].filter(Boolean).join(" ").trim() ||
        "Ohne Namen",
      role: m.role,
      status: m.status,
      currentCohortId: myCohorts[0]?.cohort_id ?? "",
      orgName: m.organizations?.name ?? "–",
      cohortNames: myCohorts.map((c) => c.cohorts?.name).filter(Boolean).join(", "),
      email,
      lastLogin: auth?.lastSignInAt ?? null,
      invitationLabel: invitation ? "Einladung offen" : null,
    };
  });

  const pageCount = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const hrefForPage = (p: number): string => {
    const params = new URLSearchParams();
    if (filter.organisation) params.set("organisation", filter.organisation);
    if (filter.gruppe) params.set("gruppe", filter.gruppe);
    if (filter.rolle) params.set("rolle", filter.rolle);
    if (filter.status) params.set("status", filter.status);
    if (p > 1) params.set("seite", String(p));
    const qs = params.toString();
    return qs === "" ? "/teilnehmer" : `/teilnehmer?${qs}`;
  };

  const columns: Array<DataTableColumn<ListRow>> = [
    {
      key: "name",
      header: "Name",
      render: (r) => <span className="font-bold text-ink">{r.name}</span>,
    },
    {
      key: "email",
      header: "E-Mail",
      render: (r) => r.email ?? <span className="text-ink-soft">n/a</span>,
    },
    { key: "org", header: "Organisation", render: (r) => r.orgName },
    {
      key: "cohorts",
      header: "Gruppe",
      render: (r) => (r.cohortNames !== "" ? r.cohortNames : <span className="text-ink-soft">–</span>),
    },
    { key: "role", header: "Rolle", render: (r) => ROLE_LABELS[r.role] },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span className="inline-flex flex-wrap gap-1">
          <Badge tone={STATUS_META[r.status].tone}>{STATUS_META[r.status].label}</Badge>
          {r.invitationLabel ? <Badge tone="warning">{r.invitationLabel}</Badge> : null}
        </span>
      ),
    },
    {
      key: "login",
      header: "Letzter Login",
      render: (r) =>
        r.lastLogin ? (
          <span className="whitespace-nowrap text-xs">{formatDateTime(r.lastLogin)}</span>
        ) : (
          <span className="text-ink-soft">n/a</span>
        ),
    },
    {
      key: "actions",
      header: "Aktionen",
      className: "w-36",
      render: (r) => (
        <RowActions
          row={r}
          cohorts={cohorts
            .filter((c) => c.organization_id === r.organizationId)
            .map((c): CohortOption => ({ id: c.id, name: c.name }))}
          canManage={canManage}
          isSuperAdmin={actor.isSuperAdmin}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        kicker="Verwaltung"
        title="Teilnehmer"
        description="Alle Personen über Unternehmen und Gruppen hinweg. Konten werden deaktiviert, nie gelöscht."
        actions={
          canInvite ? (
            <div className="flex items-center gap-3">
              <Link
                href="/teilnehmer/import"
                className="inline-flex min-h-touch items-center justify-center rounded border border-ink bg-white px-5 text-sm font-bold uppercase tracking-kicker text-ink hover:bg-paper"
              >
                CSV-Import
              </Link>
              <Link
                href="/teilnehmer/einladen"
                className="inline-flex min-h-touch items-center justify-center rounded bg-green px-5 text-sm font-bold uppercase tracking-kicker text-dark hover:bg-green-bright"
              >
                Einladen
              </Link>
            </div>
          ) : undefined
        }
      />

      {sp.fehler ? (
        <p role="alert" className="mb-4 rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
          {sp.fehler === "recht" ? ERROR_MESSAGES.forbidden : ERROR_MESSAGES.save}
        </p>
      ) : null}
      {sp.ok ? (
        <p role="status" className="mb-4 rounded border border-success/40 bg-success/10 px-4 py-3 text-sm text-ink">
          {sp.ok === "eingeladen"
            ? "Die Einladung wurde versendet."
            : sp.ok === "gesendet"
              ? "Die Einladung wurde erneut versendet."
              : "Die Einladung wurde zurückgezogen."}
        </p>
      ) : null}

      {/* Filter */}
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded border border-line bg-white p-4">
        <div>
          <label htmlFor="f-org" className="mb-1.5 block text-xs font-bold uppercase tracking-kicker text-ink-soft">
            Organisation
          </label>
          <select
            id="f-org"
            name="organisation"
            defaultValue={filter.organisation}
            className="block min-h-touch min-w-44 rounded border border-line bg-white px-3 text-sm text-ink focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep"
          >
            <option value="">Alle</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-cohort" className="mb-1.5 block text-xs font-bold uppercase tracking-kicker text-ink-soft">
            Gruppe
          </label>
          <select
            id="f-cohort"
            name="gruppe"
            defaultValue={filter.gruppe}
            className="block min-h-touch min-w-44 rounded border border-line bg-white px-3 text-sm text-ink focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep"
          >
            <option value="">Alle</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-role" className="mb-1.5 block text-xs font-bold uppercase tracking-kicker text-ink-soft">
            Rolle
          </label>
          <select
            id="f-role"
            name="rolle"
            defaultValue={filter.rolle}
            className="block min-h-touch min-w-36 rounded border border-line bg-white px-3 text-sm text-ink focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep"
          >
            <option value="">Alle</option>
            {(Object.keys(ROLE_LABELS) as MemberRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-status" className="mb-1.5 block text-xs font-bold uppercase tracking-kicker text-ink-soft">
            Status
          </label>
          <select
            id="f-status"
            name="status"
            defaultValue={filter.status}
            className="block min-h-touch min-w-32 rounded border border-line bg-white px-3 text-sm text-ink focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep"
          >
            <option value="">Alle</option>
            <option value="active">Aktiv</option>
            <option value="inactive">Inaktiv</option>
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Filtern
        </Button>
        <Link
          href="/teilnehmer"
          className="inline-flex min-h-touch items-center rounded px-3 text-sm font-bold uppercase tracking-kicker text-ink-soft hover:bg-paper hover:text-ink"
        >
          Zurücksetzen
        </Link>
      </form>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.membershipId}
        caption="Liste aller Teilnehmer"
        pagination={{ page, pageCount, hrefForPage }}
        empty={
          <EmptyState
            title="Keine Teilnehmer gefunden"
            description="Passen Sie die Filter an oder laden Sie neue Teilnehmer ein."
          />
        }
      />

      {/* Offene Einladungen: Personen ohne Konto erscheinen hier */}
      {canInvite ? (
        <Card title={`Offene Einladungen (${pendingInvitations.length})`} className="mt-8">
          {invitationsRes.error ? (
            <ErrorState message={ERROR_MESSAGES.load} />
          ) : pendingInvitations.length === 0 ? (
            <p className="text-sm text-ink-soft">Aktuell sind keine Einladungen offen.</p>
          ) : (
            <ul className="divide-y divide-line/60">
              {pendingInvitations.map((inv) => {
                const expired = Date.parse(inv.expires_at) <= nowMs;
                const orgName = orgs.find((o) => o.id === inv.organization_id)?.name ?? "–";
                return (
                  <li key={inv.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink">{inv.email}</p>
                      <p className="text-xs text-ink-soft">
                        {orgName} · {ROLE_LABELS[inv.role]} · gültig bis {formatDate(inv.expires_at)}
                      </p>
                    </div>
                    {expired ? <Badge tone="danger">Abgelaufen</Badge> : <Badge tone="warning">Offen</Badge>}
                    <form action={resendInvitationAction}>
                      <input type="hidden" name="invitationId" value={inv.id} />
                      <Button type="submit" variant="secondary" size="sm">
                        Erneut senden
                      </Button>
                    </form>
                    <form action={revokeInvitationAction}>
                      <input type="hidden" name="invitationId" value={inv.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Zurückziehen
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      ) : null}
    </>
  );
}
