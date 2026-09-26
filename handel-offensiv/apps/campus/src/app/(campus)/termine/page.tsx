import type { Metadata } from "next";
import Link from "next/link";

import { APP } from "@handel-offensiv/config";
import { Badge, Banner, Card, EmptyState, ErrorState, Kicker, ModuleNumber, PageHeader } from "@handel-offensiv/ui";

import { loadSessions, type SessionWithModule } from "@/features/termine/data";
import { countdownLabel, countdownSentence, formatSessionDate, formatSessionDateShort, formatSessionTimeRange } from "@/features/termine/format";
import { requireCampusSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Termine" };

/**
 * TERMINE: naechster Offensivtag prominent mit Countdown, darunter alle
 * kommenden Termine und – eingeklappt – die vergangenen. Sichtbarkeit der
 * Termine erzwingt die Datenbank (RLS cohort_sessions_select).
 */
export default async function TerminePage() {
  const session = await requireCampusSession();

  if (session.cohort === null) {
    return (
      <>
        <PageHeader kicker="Präsenztage" title="Termine" />
        <Banner
          kind="info"
          message={`Ihrem Konto ist noch keine Gruppe zugeordnet. Bitte wenden Sie sich an Ihren Ansprechpartner bei ${APP.company}.`}
        />
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const { upcoming, past, error } = await loadSessions(supabase, session.cohort.id, now);
  const next = upcoming[0];

  return (
    <>
      <PageHeader
        kicker="Präsenztage"
        title="Termine"
        description={`Alle Offensivtage Ihrer Gruppe „${session.cohort.name}“ – mit Ort, Zeiten und Anfahrt.`}
      />

      {error ? (
        <ErrorState message={error} />
      ) : upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          title="Noch keine Termine"
          description="Sobald Ihre Offensivtage geplant sind, sehen Sie hier alle Termine Ihrer Gruppe – mit Ort, Zeiten und Anfahrt."
        />
      ) : (
        <div className="space-y-8">
          {next !== undefined ? (
            <NextSessionHero session={next} now={now} />
          ) : (
            <Card>
              <h2 className="text-base font-bold text-ink">Kein weiterer Termin geplant</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Alle Offensivtage Ihrer Gruppe liegen bereits hinter Ihnen. Unten finden Sie die vergangenen Termine.
              </p>
            </Card>
          )}

          {upcoming.length > 0 ? (
            <section aria-labelledby="kommende-termine" className="space-y-3">
              <Kicker>
                <span id="kommende-termine">Alle kommenden Termine</span>
              </Kicker>
              <Card padding="none">
                <ol className="divide-y divide-line">
                  {upcoming.map((s) => (
                    <li key={s.id}>
                      <SessionRow session={s} now={now} />
                    </li>
                  ))}
                </ol>
              </Card>
            </section>
          ) : null}

          {past.length > 0 ? (
            <details className="group rounded border border-line bg-white">
              <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-sm font-bold uppercase tracking-kicker text-ink-soft [&::-webkit-details-marker]:hidden">
                <span>
                  Vergangene Termine <span className="font-medium normal-case tracking-normal">({past.length})</span>
                </span>
                <span aria-hidden="true" className="text-xs transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <ol className="divide-y divide-line border-t border-line opacity-70">
                {past.map((s) => (
                  <li key={s.id}>
                    <SessionRow session={s} now={now} past />
                  </li>
                ))}
              </ol>
            </details>
          ) : null}
        </div>
      )}
    </>
  );
}

/* ------------------------------ Bausteine ------------------------------ */

function NextSessionHero({ session, now }: { session: SessionWithModule; now: Date }) {
  const dayNumber = session.modules?.position ?? null;
  const sentence = countdownSentence(session, dayNumber, now);
  const place = session.venue ? (session.room ? `${session.venue} · ${session.room}` : session.venue) : null;

  return (
    <section aria-labelledby="naechster-offensivtag" className="pitch-lines-dark rounded border border-line-dark bg-navy p-5 text-paper sm:p-6">
      <Kicker onDark>Nächster Offensivtag</Kicker>
      <p className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-gold-bright sm:text-3xl" aria-live="polite">
        {sentence}
      </p>
      <h2 id="naechster-offensivtag" className="mt-2 text-lg font-bold text-paper sm:text-xl">
        {session.title}
      </h2>
      {session.modules ? (
        <p className="mt-1 text-sm text-paper/80">
          Modul {session.modules.number_label} · {session.modules.title}
        </p>
      ) : null}

      <dl className="mt-4 grid gap-2 border-t border-line-dark pt-4 text-sm sm:grid-cols-2">
        <Fact label="Datum" value={formatSessionDate(session)} />
        <Fact label="Uhrzeit" value={formatSessionTimeRange(session)} />
        {place ? <Fact label="Ort" value={place} /> : null}
        {session.address ? <Fact label="Adresse" value={session.address} /> : null}
      </dl>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/termine/${session.id}`}
          className="inline-flex min-h-touch items-center justify-center rounded bg-gold-bright px-5 text-sm font-bold uppercase tracking-kicker text-navy hover:bg-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
        >
          Details &amp; Anfahrt
        </Link>
        <a
          href={`/termine/${session.id}/kalender.ics`}
          download
          className="inline-flex min-h-touch items-center justify-center rounded border border-paper/40 px-5 text-sm font-bold uppercase tracking-kicker text-paper hover:border-gold-bright hover:text-gold-bright focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
        >
          In Kalender übernehmen
        </a>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-xs font-bold uppercase tracking-kicker text-paper/60">{label}</dt>
      <dd className="text-paper">{value}</dd>
    </div>
  );
}

function SessionRow({ session, now, past = false }: { session: SessionWithModule; now: Date; past?: boolean }) {
  const countdown = countdownLabel(session, now);
  const subtitle = [`${formatSessionDateShort(session)}, ${formatSessionTimeRange(session)}`, session.venue]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" · ");

  return (
    <Link
      href={`/termine/${session.id}`}
      className="flex min-h-touch items-center gap-4 px-5 py-3 hover:bg-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
    >
      <span className={past ? "w-10 shrink-0 text-center text-xl font-extrabold text-ink-soft/50" : "w-10 shrink-0 text-center"}>
        {past ? (session.modules?.number_label ?? "–") : <ModuleNumber label={session.modules?.number_label ?? "–"} className="text-center text-2xl sm:text-3xl" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-ink">{session.title}</span>
        <span className="block text-xs text-ink-soft">{subtitle}</span>
      </span>
      {past ? <Badge tone="neutral">Vergangen</Badge> : countdown === "heute" ? <Badge tone="gold">Heute</Badge> : countdown === "morgen" ? <Badge tone="brand">Morgen</Badge> : null}
      <span aria-hidden="true" className="text-ink-soft">
        ›
      </span>
    </Link>
  );
}
