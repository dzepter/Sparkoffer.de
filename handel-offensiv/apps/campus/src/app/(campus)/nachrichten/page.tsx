import type { Metadata } from "next";
import Link from "next/link";

import type { NotificationRow } from "@handel-offensiv/types";
import { Badge, Card, EmptyState, ErrorState, Kicker, PageHeader, cn } from "@handel-offensiv/ui";

import { loadNachrichten, type Announcement } from "@/features/nachrichten/data";
import { KIND_LABELS, formatDateLong, relativeTime, safeInternalLink } from "@/features/nachrichten/format";
import { MarkAllReadForm, MarkReadForm } from "@/features/nachrichten/forms";
import { requireCampusSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nachrichten" };

/**
 * NACHRICHTEN: eigene In-App-Benachrichtigungen (gelesen/ungelesen) und die
 * Ankuendigungen der aktiven Gruppe (neueste zuerst). RLS liefert
 * ausschliesslich eigene Benachrichtigungen bzw. Ankuendigungen der eigenen
 * Gruppe; read_at-Updates sind nur auf eigenen Zeilen erlaubt.
 */
export default async function NachrichtenPage() {
  const session = await requireCampusSession();
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const data = await loadNachrichten(supabase, session.cohort?.id ?? null, now);

  return (
    <>
      <PageHeader
        kicker="Für Sie"
        title="Nachrichten"
        description="Neue Freischaltungen, Erinnerungen an Ihre Offensivtage, Feedback Ihres Trainers und die Ankündigungen Ihrer Gruppe."
      />

      {data.error ? (
        <ErrorState message={data.error} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section aria-labelledby="benachrichtigungen" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Kicker>
                <span id="benachrichtigungen">Benachrichtigungen</span>
                {data.unreadCount > 0 ? (
                  <Badge tone="dark" className="ml-1">
                    {data.unreadCount} neu
                  </Badge>
                ) : null}
              </Kicker>
              {data.unreadCount > 0 ? <MarkAllReadForm /> : null}
            </div>

            {data.notifications.length === 0 ? (
              <EmptyState
                title="Keine Benachrichtigungen"
                description="Hier informieren wir Sie über neue Freischaltungen, Ihre Offensivtage, fällige Aufgaben und Feedback Ihres Trainers."
              />
            ) : (
              <Card padding="none">
                <ol className="divide-y divide-line">
                  {data.notifications.map((n) => (
                    <li key={n.id}>
                      <NotificationItem notification={n} now={now} />
                    </li>
                  ))}
                </ol>
              </Card>
            )}
          </section>

          <section aria-labelledby="ankuendigungen" className="space-y-3">
            <Kicker>
              <span id="ankuendigungen">Ankündigungen {session.cohort ? `· ${session.cohort.name}` : ""}</span>
            </Kicker>
            {session.cohort === null ? (
              <p className="text-sm text-ink-soft">Ankündigungen sehen Sie, sobald Ihr Konto einer Gruppe zugeordnet ist.</p>
            ) : data.announcements.length === 0 ? (
              <EmptyState title="Noch keine Ankündigungen" description="Ihr Trainer informiert Sie hier über alles Wichtige rund um Ihre Gruppe." />
            ) : (
              <div className="space-y-4">
                {data.announcements.map((a, index) => (
                  // Gold sparsam: nur die neueste Ankuendigung ist hervorgehoben
                  <AnnouncementCard key={a.id} announcement={a} highlighted={index === 0} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

/* ------------------------------ Bausteine ------------------------------ */

/**
 * Ungelesen = EIN goldener Marker (linke Kante) + fetter Titel; das
 * "Neu"-Badge ist bewusst navy (Palette v2: Gold nur sparsam).
 */
function NotificationItem({ notification, now }: { notification: NotificationRow; now: Date }) {
  const unread = notification.read_at === null;
  const link = safeInternalLink(notification.deep_link);
  const kindLabel = KIND_LABELS[notification.kind] ?? "Nachricht";

  const body = (
    <>
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-kicker text-ink-soft">{kindLabel}</span>
        {unread ? <Badge tone="brand">Neu</Badge> : null}
        <span className="text-xs text-ink-soft">{relativeTime(notification.created_at, now)}</span>
      </span>
      <span className={cn("mt-0.5 block text-sm", unread ? "font-bold text-ink" : "text-ink")}>{notification.title}</span>
      {notification.body ? <span className="mt-0.5 block text-sm text-ink-soft">{notification.body}</span> : null}
    </>
  );

  return (
    <div className={cn("flex items-start gap-3 px-5 py-4", unread && "border-l-[3px] border-l-gold")}>
      <div className="min-w-0 flex-1">
        {link ? (
          <Link href={link} className="block hover:underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy">
            {body}
          </Link>
        ) : (
          <div>{body}</div>
        )}
        {link ? (
          <Link href={link} className="mt-1 inline-flex min-h-touch items-center text-xs font-bold uppercase tracking-kicker text-navy hover:underline">
            Öffnen ›
          </Link>
        ) : null}
      </div>
      {unread ? <MarkReadForm notificationId={notification.id} /> : null}
    </div>
  );
}

function AnnouncementCard({ announcement, highlighted = false }: { announcement: Announcement; highlighted?: boolean }) {
  return (
    <Card highlighted={highlighted}>
      <p className="text-xs text-ink-soft">{formatDateLong(announcement.published_at)}</p>
      <h3 className="mt-1 text-base font-bold text-ink">{announcement.title}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">{announcement.body}</p>
    </Card>
  );
}
