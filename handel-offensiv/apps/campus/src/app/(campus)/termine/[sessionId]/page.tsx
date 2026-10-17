import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { Badge, Banner, Card, ErrorState, Kicker, ModuleNumber, PageHeader } from "@handel-offensiv/ui";

import { loadSessionDetail } from "@/features/termine/data";
import { countdownLabel, formatDateTime, formatSessionDate, formatSessionTimeRange, isPastSession } from "@/features/termine/format";
import { SessionNoteForm } from "@/features/termine/session-note-form";
import { requireCampusSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Termin" };

const uuid = z.string().uuid();

/**
 * Termin-Detail: Datum/Zeit, Ort, Raum, Adresse, Trainer (nur falls per RLS
 * lesbar), Modulbezug, Agenda/Hinweise, Anfahrt, ICS-Download und die
 * persoenliche Notiz. Unsichtbare Termine (RLS) erscheinen als verstaendlicher
 * "nicht verfuegbar"-Zustand – nie als technischer Fehler.
 */
export default async function TerminDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = await requireCampusSession();

  const back = (
    <Link href="/termine" className="inline-flex min-h-touch items-center text-xs font-bold uppercase tracking-kicker text-ink-soft hover:text-ink">
      ‹ Termine
    </Link>
  );

  if (!uuid.safeParse(sessionId).success) {
    return (
      <>
        {back}
        <Banner kind="info" className="mt-4" message="Dieser Termin ist nicht mehr verfügbar oder für Sie nicht sichtbar." />
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const detail = await loadSessionDetail(supabase, sessionId, session.userId);

  if (detail.error) {
    return (
      <>
        {back}
        <ErrorState className="mt-4" message={detail.error} />
      </>
    );
  }
  if (detail.session === null) {
    return (
      <>
        {back}
        <Banner kind="info" className="mt-4" message="Dieser Termin ist nicht mehr verfügbar oder für Sie nicht sichtbar." />
      </>
    );
  }

  const s = detail.session;
  const past = isPastSession(s, now);
  const countdown = countdownLabel(s, now);
  const statusLine = past
    ? "Dieser Termin liegt in der Vergangenheit."
    : countdown === "heute"
      ? "Findet heute statt."
      : countdown
        ? `Beginnt ${countdown}.`
        : "Läuft gerade.";

  return (
    <>
      {back}
      <PageHeader
        kicker="Offensivtag"
        title={s.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {statusLine}
            {countdown === "heute" ? <Badge tone="gold">Heute</Badge> : past ? <Badge tone="neutral">Vergangen</Badge> : null}
          </span>
        }
        className="mt-2"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <Card title="Wann und wo">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Datum" value={formatSessionDate(s)} />
              <Detail label="Uhrzeit" value={formatSessionTimeRange(s)} />
              {s.venue ? <Detail label="Ort" value={s.venue} /> : null}
              {s.room ? <Detail label="Raum" value={s.room} /> : null}
              {s.address ? <Detail label="Adresse" value={s.address} /> : null}
              {detail.trainerName ? <Detail label="Trainer" value={detail.trainerName} /> : null}
            </dl>
            <a
              href={`/termine/${s.id}/kalender.ics`}
              download
              className="mt-5 inline-flex min-h-touch w-full items-center justify-center rounded bg-navy px-5 text-sm font-bold uppercase tracking-kicker text-white hover:bg-navy-soft sm:w-auto"
            >
              In Kalender übernehmen
            </a>
            <p className="mt-2 text-xs text-ink-soft">Lädt eine Kalenderdatei (.ics) herunter, die Sie in Outlook, Google Kalender oder Apple Kalender öffnen können.</p>
          </Card>

          {s.notes ? (
            <Card title="Agenda und Hinweise">
              <p className="whitespace-pre-line text-sm leading-6 text-ink">{s.notes}</p>
            </Card>
          ) : null}

          {s.directions ? (
            <Card title="Anfahrt">
              <p className="whitespace-pre-line text-sm leading-6 text-ink">{s.directions}</p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {s.modules ? (
            <Card highlighted>
              <div className="flex items-start gap-4">
                <ModuleNumber label={s.modules.number_label} />
                <div className="min-w-0">
                  <Kicker>Modul an diesem Tag</Kicker>
                  <h2 className="mt-1 text-base font-bold text-ink">{s.modules.title}</h2>
                  {s.modules.claim ? <p className="mt-1 text-sm text-ink-soft">{s.modules.claim}</p> : null}
                </div>
              </div>
            </Card>
          ) : null}

          <Card title="Meine Notizen">
            <SessionNoteForm
              sessionId={s.id}
              initialNote={detail.note?.note_md ?? ""}
              updatedAtLabel={detail.note ? `Zuletzt gespeichert am ${formatDateTime(detail.note.updated_at)}` : null}
            />
          </Card>
        </div>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-kicker text-ink-soft">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  );
}
