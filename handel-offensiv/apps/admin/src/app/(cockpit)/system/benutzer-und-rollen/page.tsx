import { redirect } from "next/navigation";

import type { MemberRole, MemberStatus } from "@handel-offensiv/types";

import { Badge, DataTable, EmptyState, ErrorState, PageHeader } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { loadAuthUserMap } from "@/app/(cockpit)/teilnehmer/auth-users";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { RoleSelect, ROLE_LABELS } from "./role-select";

export const dynamic = "force-dynamic";

/**
 * SYSTEM / BENUTZER & ROLLEN: Alle Profile mit ihren Rollen ueber alle
 * Organisationen hinweg. Nur Super Admins (Gate im System-Layout + hier).
 *
 * Der Lesezugriff laeuft ueber den Service-Role-Client, weil die
 * organisationsuebergreifende Sicht per RLS bewusst gesperrt ist –
 * NACH erneuter Super-Admin-Pruefung.
 *
 * Das Super-Admin-Flag wird NUR angezeigt (nicht schaltbar, §23).
 */

interface MembershipRow {
  id: string;
  role: MemberRole;
  status: MemberStatus;
  organization_id: string;
  organizations: { name: string } | null;
}

interface ProfileRowData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  is_super_admin: boolean;
  status: MemberStatus;
  organization_memberships: MembershipRow[];
}

function personName(p: ProfileRowData): string {
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return name !== "" ? name : "Ohne Namen";
}

export default async function BenutzerUndRollenPage() {
  const session = await getActorContext();
  if (!session) redirect("/login");
  if (!session.actor.isSuperAdmin) {
    return <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />;
  }

  const admin = createSupabaseAdminClient();
  const [{ data, error }, authUsers] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, first_name, last_name, is_super_admin, status, organization_memberships(id, role, status, organization_id, organizations(name))",
      )
      .order("last_name", { ascending: true, nullsFirst: false }),
    loadAuthUserMap(),
  ]);

  if (error) {
    return (
      <>
        <PageHeader kicker="System" title="Benutzer & Rollen" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }

  const profiles = (data ?? []) as unknown as ProfileRowData[];

  const columns: Array<DataTableColumn<ProfileRowData>> = [
    {
      key: "person",
      header: "Person",
      render: (p) => (
        <div>
          <p className="font-bold text-ink">
            {personName(p)}
            {p.is_super_admin ? (
              <Badge tone="dark" className="ml-2 align-middle">
                Super Admin
              </Badge>
            ) : null}
          </p>
          <p className="text-xs text-ink-soft">{authUsers.get(p.id)?.email ?? "E-Mail n/a"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "whitespace-nowrap",
      render: (p) =>
        p.status === "active" ? (
          <Badge tone="success">Aktiv</Badge>
        ) : (
          <Badge tone="warning">Inaktiv</Badge>
        ),
    },
    {
      key: "memberships",
      header: "Rollen je Organisation",
      render: (p) =>
        p.organization_memberships.length === 0 ? (
          <span className="text-sm text-ink-soft">
            {p.is_super_admin ? "Keine Organisationszuordnung nötig" : "Keine Mitgliedschaft"}
          </span>
        ) : (
          <ul className="space-y-3">
            {p.organization_memberships.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3">
                <span className="min-w-40 text-sm text-ink">
                  {m.organizations?.name ?? "Unbekannte Organisation"}
                  {m.status === "inactive" ? (
                    <Badge tone="warning" className="ml-2 align-middle">
                      Inaktiv
                    </Badge>
                  ) : null}
                </span>
                <RoleSelect
                  membershipId={m.id}
                  currentRole={m.role}
                  personLabel={personName(p)}
                  organizationLabel={m.organizations?.name ?? "Organisation"}
                />
              </li>
            ))}
          </ul>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        kicker="System"
        title="Benutzer & Rollen"
        description={
          <>
            Alle Konten über sämtliche Organisationen hinweg. Rollen ({ROLE_LABELS.org_admin},{" "}
            {ROLE_LABELS.trainer}, {ROLE_LABELS.participant}) ändern Sie hier je Mitgliedschaft.
            Das Super-Admin-Kennzeichen wird nur angezeigt und ist im Cockpit bewusst nicht
            veränderbar.
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={profiles}
        rowKey={(p) => p.id}
        caption="Alle Benutzerkonten mit Rollen je Organisation"
        empty={
          <EmptyState
            title="Noch keine Benutzer"
            description="Laden Sie Personen über den Bereich Teilnehmer ein."
          />
        }
      />
    </>
  );
}
