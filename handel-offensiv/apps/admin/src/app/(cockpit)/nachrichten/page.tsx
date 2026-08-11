import Link from "next/link";

import { can } from "@handel-offensiv/domain";

import { Badge, EmptyState, ErrorState, PageHeader } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { ERROR_MESSAGES } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * NACHRICHTEN (§19): Ankuendigungen je Gruppe.
 * Lesend im Nutzer-Kontext (RLS): Trainer sehen die Ankuendigungen ihrer
 * Gruppen, Super Admins alle. Neue Ankuendigungen unter /nachrichten/neu.
 */

interface CohortOption {
  id: string;
  name: string;
  organization_id: string;
  organizations: { name: string } | null;
}

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  published_at: string;
  cohorts: { name: string } | null;
  profiles: { first_name: string | null; last_name: string | null } | null;
}

function firstString(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s !== undefined && s !== "" ? s : undefined;
}

function authorName(a: AnnouncementRow): string {
  const name = [a.profiles?.first_name, a.profiles?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name.length > 0 ? name : "Unbekannt";
}

export default async function NachrichtenPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const session = await getActorContext();
  if (!session) return <ErrorState message={ERROR_MESSAGES.sessionExpired} />;
  const { actor } = session;

  const gruppeFilter = firstString(sp.gruppe);
  const erfolg = firstString(sp.erfolg) === "1";
  const pushFehler = firstString(sp.push) === "fehler";

  const supabase = await createSupabaseServerClient();

  const cohortsRes = await supabase
    .from("cohorts")
    .select("id, name, organization_id, organizations(name)")
    .order("name");
  if (cohortsRes.error) {
    return (
      <>
        <PageHeader kicker="Kommunikation" title="Nachrichten" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }
  const cohorts = (cohortsRes.data ?? []) as unknown as CohortOption[];

  // Senden erlaubt? (Trainer: eigene Gruppen; Org-Admin nur mit Override)
  const maySend = cohorts.some(
    (c) =>
      can(actor, "notifications.send", { cohortId: c.id }) ||
      can(actor, "notifications.send", { organizationId: c.organization_id }),
  );

  let query = supabase
    .from("announcements")
    .select("id, title, body, published_at, cohorts(name), profiles(first_name, last_name)")
    .order("published_at", { ascending: false })
    .limit(100);
  if (gruppeFilter !== undefined) query = query.eq("cohort_id", gruppeFilter);

  const { data, error } = await query;
  if (error) {
    return (
      <>
        <PageHeader kicker="Kommunikation" title="Nachrichten" />
        <ErrorState message={ERROR_MESSAGES.load} />
      </>
    );
  }
  const announcements = (data ?? []) as unknown as AnnouncementRow[];

  return (
    <>
      <PageHeader
        kicker="Kommunikation"
        title="Nachrichten"
        description="Ankündigungen erreichen alle Teilnehmer einer Gruppe im Mannschaftsraum. Bitte sparsam einsetzen – jede Nachricht kostet Aufmerksamkeit."
        actions={
          maySend ? (
            <Link
              href="/nachrichten/neu"
              className="inline-flex min-h-touch items-center justify-center rounded bg-green px-5 text-sm font-bold uppercase tracking-kicker text-dark hover:bg-green-bright"
            >
              Neue Ankündigung
            </Link>
          ) : undefined
        }
      />

      {erfolg ? (
        <p
          role="status"
          className="mb-6 rounded border border-success/40 bg-success/5 px-4 py-3 text-sm text-success"
        >
          Die Ankündigung wurde veröffentlicht.
          {pushFehler
            ? " Die Push-Benachrichtigung konnte allerdings nicht versendet werden."
            : ""}
        </p>
      ) : null}

      {/* Gruppen-Filter */}
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="filter-gruppe" className="mb-1.5 block text-sm font-bold text-ink">
            Gruppe
          </label>
          <select
            id="filter-gruppe"
            name="gruppe"
            defaultValue={gruppeFilter ?? ""}
            className="block min-h-touch min-w-56 rounded border border-line bg-white px-3 text-base text-ink focus:border-green-deep focus:outline-none focus:ring-2 focus:ring-green-deep"
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
          className="inline-flex min-h-touch items-center rounded border border-ink bg-white px-5 text-sm font-bold uppercase tracking-kicker text-ink hover:bg-paper"
        >
          Anzeigen
        </button>
      </form>

      {announcements.length === 0 ? (
        <EmptyState
          title="Noch keine Ankündigung"
          description="Veröffentlichen Sie eine Ankündigung, um eine Gruppe über Termine oder Neuigkeiten zu informieren."
          action={
            maySend ? (
              <Link
                href="/nachrichten/neu"
                className="inline-flex min-h-touch items-center justify-center rounded bg-green px-5 text-sm font-bold uppercase tracking-kicker text-dark hover:bg-green-bright"
              >
                Neue Ankündigung
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-4">
          {announcements.map((a) => (
            <li key={a.id} className="rounded border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-ink">{a.title}</h2>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {a.cohorts?.name ?? "Unbekannte Gruppe"} · {authorName(a)} ·{" "}
                    {formatDateTime(a.published_at)}
                  </p>
                </div>
                <Badge tone="brand">Ankündigung</Badge>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-ink">{a.body}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
