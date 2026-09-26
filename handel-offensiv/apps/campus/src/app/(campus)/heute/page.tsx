import type { Metadata } from "next";
import Link from "next/link";

import { Badge, Banner, Card, EmptyState, Kicker, ProgressBar } from "@handel-offensiv/ui";

import { blockTypeLabel } from "@/features/lernen/complete";
import { loadDashboard } from "@/features/lernen/data";
import { formatDateLong, formatDue, formatInDays, formatMinutes, formatTime } from "@/features/lernen/format";
import { firstName, requireCampusSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Heute" };

const PHASE_LABEL: Record<string, string> = {
  before_day: "Vor dem Offensivtag",
  day: "Offensivtag",
  after_day: "Nach dem Offensivtag",
  prep_next: "Vorbereitung",
};

/**
 * HEUTE (§8/§10): persoenliche Begruessung, wichtigste Lektion (Gold-Karte +
 * Gold-CTA), aktuelle Phase, naechster Offensivtag, offene Aufgaben, Modul-
 * fortschritt, neueste Ankuendigung. Gold: Karte, CTA, Fortschritt – nicht mehr.
 */
export default async function HeutePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [session, query] = await Promise.all([requireCampusSession(), searchParams]);
  const name = firstName(session.profile);
  const greeting = name ? `Guten Tag, ${name}.` : "Guten Tag.";
  const welcome = query.willkommen === "1";

  if (session.cohort === null) {
    return (
      <div>
        <Kicker>Heute</Kicker>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">{greeting}</h1>
        <div className="mt-6">
          <EmptyState
            title="Sie sind noch keiner Gruppe zugeordnet"
            description="Sobald Ihr Unternehmen Sie einer Gruppe zugeordnet hat, erscheinen hier Ihr Programm, Ihre Termine und Ihre nächsten Schritte."
          />
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { dashboard, curriculum } = await loadDashboard(supabase, session.userId, session.cohort.id);
  const { featuredLesson, currentPhase, nextSession, openTasks, progress, announcement } = dashboard;
  const moduleById = new Map(curriculum.modules.map((m) => [m.id, m]));
  const nextSessionModule = nextSession?.module_id ? moduleById.get(nextSession.module_id) : undefined;

  return (
    <div className="space-y-6">
      <header>
        <Kicker>Heute</Kicker>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">{greeting}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {curriculum.program?.title ?? "Handel Offensiv"} · {session.cohort.name}
          {session.organization ? ` · ${session.organization.name}` : ""}
        </p>
      </header>

      {welcome ? (
        <Banner
          kind="success"
          message={
            <>
              <span className="font-bold">Willkommen im Campus.</span> Handel ist Mannschaftssport. Führung entscheidet das Spiel. Hier finden Sie ab sofort Ihre Lektionen, Termine und Aufgaben.
            </>
          }
        />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Wichtigste Lektion */}
        <div className="lg:col-span-2">
          {featuredLesson ? (
            <Card highlighted>
              <Kicker>Ihre nächste Lektion</Kicker>
              {currentPhase ? (
                <p className="mt-3 text-xs font-bold uppercase tracking-kicker text-ink-soft">
                  Modul {currentPhase.moduleNumberLabel} · {PHASE_LABEL[currentPhase.phaseType] ?? currentPhase.phaseTitle}
                </p>
              ) : null}
              <h2 className="mt-1 text-xl font-extrabold leading-tight text-ink sm:text-2xl">{featuredLesson.title}</h2>
              {featuredLesson.summary ? <p className="mt-2 text-sm text-ink-soft">{featuredLesson.summary}</p> : null}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                {featuredLesson.estimatedMinutes !== null ? <span>ca. {formatMinutes(featuredLesson.estimatedMinutes)}</span> : null}
                {featuredLesson.dueAt ? <Badge tone="brand">{formatDue(featuredLesson.dueAt)}</Badge> : null}
              </div>
              <Link
                href={`/lektionen/${featuredLesson.lessonId}`}
                className="mt-5 inline-flex min-h-touch items-center justify-center rounded bg-gold-bright px-6 text-sm font-bold uppercase tracking-kicker text-navy hover:bg-gold"
              >
                Jetzt bearbeiten
              </Link>
            </Card>
          ) : (
            <Card highlighted>
              <Kicker>Ihre nächste Lektion</Kicker>
              <h2 className="mt-3 text-xl font-extrabold leading-tight text-ink">
                {curriculum.lessons.length > 0 ? "Alles bearbeitet – stark." : "Noch keine Lektion freigeschaltet."}
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                {curriculum.lessons.length > 0
                  ? "Die nächsten Lektionen werden rund um Ihren Offensivtag freigeschaltet."
                  : "Ihre erste Lektion erscheint hier, sobald sie freigeschaltet ist."}
              </p>
              <Link href="/programm" className="mt-4 inline-flex min-h-touch items-center font-bold text-navy underline underline-offset-2">
                Zum Programm
              </Link>
            </Card>
          )}
        </div>

        {/* Naechster Offensivtag */}
        <Card title="Nächster Offensivtag">
          {nextSession ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">
                {formatInDays(nextSession.starts_at)}
                {nextSessionModule ? ` · Modul ${nextSessionModule.number_label}` : ""}
              </p>
              <p className="mt-1 text-base font-bold text-ink">{nextSession.title}</p>
              <p className="mt-1 text-sm text-ink">
                {formatDateLong(nextSession.starts_at)}, {formatTime(nextSession.starts_at)}
              </p>
              {nextSession.venue ? <p className="text-sm text-ink-soft">{nextSession.venue}</p> : null}
              <Link href="/termine" className="mt-3 inline-flex min-h-touch items-center text-sm font-bold text-navy underline underline-offset-2">
                Alle Termine
              </Link>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">Derzeit ist kein weiterer Termin geplant.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Offene Aufgaben */}
        <Card title="Offene Aufgaben">
          {openTasks.length === 0 ? (
            <p className="text-sm text-ink-soft">Keine offenen Aufgaben – alles erledigt.</p>
          ) : (
            <ul className="divide-y divide-line">
              {openTasks.map((task) => (
                <li key={task.contentBlockId}>
                  <Link href={`/lektionen/${task.lessonId}#block-${task.contentBlockId}`} className="flex min-h-touch items-center justify-between gap-3 py-2 hover:text-navy">
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-ink">{blockTypeLabel(task.blockType)}</span>
                      <span className="block truncate text-xs text-ink-soft">{task.lessonTitle}</span>
                    </span>
                    {task.dueAt ? <Badge tone="brand">{formatDue(task.dueAt)}</Badge> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Fortschritt */}
        <Card title="Ihr Fortschritt" action={<span className="text-sm font-bold text-ink">{progress.overallPercent} %</span>}>
          <ul className="space-y-3">
            {curriculum.modules.map((module) => {
              const mp = progress.modules.find((m) => m.module_id === module.id);
              return (
                <li key={module.id}>
                  <ProgressBar percent={mp?.percent ?? 0} label={`${module.number_label} ${module.title}`} />
                </li>
              );
            })}
          </ul>
          <Link href="/programm" className="mt-4 inline-flex min-h-touch items-center text-sm font-bold text-navy underline underline-offset-2">
            Zum Programm
          </Link>
        </Card>
      </div>

      {/* Aktuelle Ankuendigung */}
      {announcement ? (
        <Card title="Aktuelle Nachricht" action={<Link href="/nachrichten" className="text-sm font-bold text-navy underline underline-offset-2">Alle Nachrichten</Link>}>
          <p className="text-base font-bold text-ink">{announcement.title}</p>
          <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-ink">{announcement.body}</p>
        </Card>
      ) : null}
    </div>
  );
}
