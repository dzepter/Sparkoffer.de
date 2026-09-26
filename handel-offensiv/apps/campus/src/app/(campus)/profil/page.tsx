import type { Metadata } from "next";
import Link from "next/link";

import { APP, PRIVACY_POLICY_VERSION } from "@handel-offensiv/config";
import type { AccountDeletionRequestRow, NotificationKind, UserConsentRow } from "@handel-offensiv/types";
import { Badge, Button, Card, PageHeader } from "@handel-offensiv/ui";

import {
  DELETION_STATUS_LABELS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_KINDS,
  type NotificationChannel,
} from "@/lib/auth/profile";
import { displayName, requireCampusSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  AccountDeletionForm,
  CohortSwitchForm,
  NotificationPreferencesForm,
  PasswordChangeForm,
  ProfileNameForm,
  type PreferenceMap,
} from "./forms";

export const metadata: Metadata = { title: "Profil" };

const DEFAULT_ADMIN_URL = "https://admin.aigner-offensiv.de";

const dateFormat = new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeZone: "Europe/Berlin" });

function formatDate(value: string | null | undefined): string {
  if (!value) return "–";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "–" : dateFormat.format(d);
}

interface PreferenceRow {
  kind: NotificationKind;
  channel: string;
  enabled: boolean;
}

function buildPreferenceMap(rows: PreferenceRow[]): PreferenceMap {
  const map = {} as PreferenceMap;
  for (const kind of NOTIFICATION_KINDS) {
    map[kind] = { ...NOTIFICATION_DEFAULTS };
    for (const channel of NOTIFICATION_CHANNELS) {
      const row = rows.find((r) => r.kind === kind && r.channel === channel);
      if (row) map[kind][channel as NotificationChannel] = row.enabled;
    }
  }
  return map;
}

/**
 * Profil: Stammdaten, aktive Gruppe, Passwort, Benachrichtigungen,
 * Einwilligungen, Kontolöschung, Abmelden. Alles im Nutzerkontext (RLS).
 */
export default async function ProfilPage() {
  const session = await requireCampusSession();
  const supabase = await createSupabaseServerClient();

  const [prefsRes, consentsRes, deletionRes] = await Promise.all([
    supabase.from("notification_preferences").select("kind, channel, enabled").eq("profile_id", session.userId),
    supabase
      .from("user_consents")
      .select("id, consent_type, version, granted_at, revoked_at")
      .eq("profile_id", session.userId)
      .eq("consent_type", "privacy")
      .order("granted_at", { ascending: false }),
    supabase
      .from("account_deletion_requests")
      .select("id, status, reason, requested_at, processed_at")
      .eq("profile_id", session.userId)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const preferences = buildPreferenceMap((prefsRes.data ?? []) as PreferenceRow[]);
  const consents = (consentsRes.data ?? []) as Pick<UserConsentRow, "id" | "consent_type" | "version" | "granted_at" | "revoked_at">[];
  const activeConsent = consents.find((c) => c.revoked_at === null) ?? null;
  const deletion = (deletionRes.data ?? null) as Pick<
    AccountDeletionRequestRow,
    "id" | "status" | "reason" | "requested_at" | "processed_at"
  > | null;
  const openDeletion = deletion !== null && deletion.status !== "done" && deletion.status !== "rejected";

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL?.trim() || DEFAULT_ADMIN_URL;
  const name = displayName(session.profile, session.email);

  return (
    <>
      <PageHeader kicker="Mein Konto" title={name} description="Ihre Zugangsdaten, Ihre Gruppe und Ihre Einstellungen im Campus." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card title="Stammdaten">
            <dl className="mb-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-kicker text-ink-soft">E-Mail-Adresse</dt>
                <dd className="mt-0.5 break-all text-ink">{session.email ?? "–"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-kicker text-ink-soft">Unternehmen</dt>
                <dd className="mt-0.5 text-ink">{session.organization?.name ?? "–"}</dd>
              </div>
            </dl>
            <ProfileNameForm firstName={session.profile.first_name ?? ""} lastName={session.profile.last_name ?? ""} />
          </Card>

          <Card title="Meine Gruppe">
            {session.cohort ? (
              <>
                <p className="text-sm text-ink">
                  <span className="font-bold">{session.cohort.name}</span>
                  {session.cohort.start_date ? (
                    <span className="text-ink-soft">
                      {" "}
                      · seit {formatDate(session.cohort.start_date)}
                      {session.cohort.end_date ? ` bis ${formatDate(session.cohort.end_date)}` : ""}
                    </span>
                  ) : null}
                </p>
                {session.cohorts.length > 1 ? (
                  <div className="mt-4">
                    <CohortSwitchForm cohorts={session.cohorts} activeId={session.cohort.id} />
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-ink-soft">Sie sind aktuell einer Gruppe zugeordnet.</p>
                )}
              </>
            ) : (
              <p className="text-sm text-ink-soft">
                Sie sind derzeit keiner aktiven Gruppe zugeordnet. Bei Fragen wenden Sie sich bitte an {APP.supportEmail}.
              </p>
            )}
          </Card>

          <Card title="Passwort ändern">
            <PasswordChangeForm />
          </Card>

          <Card title="Benachrichtigungen">
            <p className="mb-4 text-sm text-ink-soft">
              Legen Sie fest, worüber wir Sie informieren – im Campus unter „Nachrichten“ und optional per E-Mail.
            </p>
            <NotificationPreferencesForm preferences={preferences} />
          </Card>
        </div>

        <div className="space-y-6">
          {session.hasCockpitAccess ? (
            <Card title="Cockpit" highlighted>
              <p className="text-sm text-ink-soft">
                Sie haben Zugang zum Trainer- und Verwaltungsbereich von {APP.name}.
              </p>
              <a
                href={adminUrl}
                className="mt-4 inline-flex min-h-touch w-full items-center justify-center rounded bg-gold-bright px-5 text-sm font-bold uppercase tracking-kicker text-navy hover:bg-gold"
              >
                Zum Cockpit
              </a>
            </Card>
          ) : null}

          <Card title="Datenschutz und Einwilligung">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-kicker text-ink-soft">Datenschutzerklärung</dt>
                <dd className="mt-0.5 text-ink">
                  {activeConsent ? (
                    <>
                      Zugestimmt am {formatDate(activeConsent.granted_at)} (Version {activeConsent.version})
                    </>
                  ) : (
                    "Keine Einwilligung hinterlegt."
                  )}
                </dd>
              </div>
              {activeConsent && activeConsent.version !== PRIVACY_POLICY_VERSION ? (
                <div>
                  <Badge tone="warning">Neue Fassung</Badge>
                  <p className="mt-1 text-xs text-ink-soft">
                    Die Datenschutzerklärung wurde aktualisiert (Version {PRIVACY_POLICY_VERSION}).
                  </p>
                </div>
              ) : null}
            </dl>
            <p className="mt-4 text-sm">
              <Link href="/datenschutz" className="inline-flex min-h-touch items-center font-bold text-navy underline-offset-2 hover:underline">
                Datenschutzerklärung lesen
              </Link>
            </p>
          </Card>

          <Card title="Konto löschen">
            {deletion && openDeletion ? (
              <div className="space-y-2 text-sm">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-ink-soft">Status:</span>
                  <Badge tone={deletion.status === "requested" ? "neutral" : "brand"}>{DELETION_STATUS_LABELS[deletion.status]}</Badge>
                </p>
                <p className="text-ink-soft">Beantragt am {formatDate(deletion.requested_at)}.</p>
                <p className="text-ink-soft">
                  Ihr Antrag wird von {APP.company} bearbeitet. Bei Fragen: {APP.supportEmail}
                </p>
              </div>
            ) : (
              <>
                {deletion?.status === "rejected" ? (
                  <p className="mb-3 text-sm text-ink-soft">
                    Ihr letzter Antrag vom {formatDate(deletion.requested_at)} wurde nicht ausgeführt. Bei Fragen: {APP.supportEmail}
                  </p>
                ) : null}
                <p className="mb-4 text-sm text-ink-soft">
                  Sie können jederzeit die Löschung Ihres Kontos beantragen. {APP.company} bestätigt den Antrag per E-Mail
                  und führt die Löschung anschließend durch.
                </p>
                <AccountDeletionForm />
              </>
            )}
          </Card>

          <Card>
            <form action="/logout" method="post">
              <Button type="submit" variant="secondary" className="w-full">
                Abmelden
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
