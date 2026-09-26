import Link from "next/link";
import type { ReactNode } from "react";

import { APP } from "@handel-offensiv/config";

import { CampusNav, FOCUS_ON_NAVY, type NavItem } from "@/components/campus-nav";
import { displayName, requireCampusSession } from "@/lib/session";

/**
 * Campus-Rahmen: Navy-Kopfzeile mit Gold fuer die aktive Navigation,
 * helle Arbeitsflaeche, mobil untere Leiste. Mobile-first.
 */
const NAV: NavItem[] = [
  { href: "/heute", label: "Heute" },
  { href: "/programm", label: "Programm" },
  { href: "/termine", label: "Termine" },
  { href: "/offensivplan", label: "Offensivplan", short: "Plan" },
  { href: "/nachrichten", label: "Nachrichten", short: "Neues" },
];

export default async function CampusLayout({ children }: { children: ReactNode }) {
  const session = await requireCampusSession();
  const name = displayName(session.profile, session.email);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="pitch-lines-dark sticky top-0 z-30 border-b border-line-dark bg-navy text-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/heute" className={`min-w-0 rounded-sm leading-tight ${FOCUS_ON_NAVY}`}>
            <span className="block text-[10px] font-bold uppercase tracking-kicker text-gold-bright">{APP.company}</span>
            <span className="block truncate text-base font-extrabold uppercase tracking-tight text-paper">
              {APP.name} <span className="font-medium text-paper/70">Campus</span>
            </span>
          </Link>

          <CampusNav items={NAV} variant="header" />

          <div className="flex shrink-0 items-center gap-2">
            {session.cohort ? (
              <span className="hidden max-w-[220px] truncate text-xs text-paper/70 lg:inline" title={session.cohort.name}>
                {session.cohort.name}
              </span>
            ) : null}
            <Link
              href="/profil"
              aria-label={`Profil von ${name}`}
              className={`inline-flex min-h-touch min-w-touch items-center justify-center rounded border border-paper/30 px-3 text-xs font-bold uppercase tracking-kicker text-paper hover:border-gold-bright hover:text-gold-bright ${FOCUS_ON_NAVY}`}
            >
              <span className="hidden sm:inline">{name}</span>
              <span className="sm:hidden">Profil</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-6 sm:px-6 sm:pt-8">{children}</main>

      {/* Rechtslinks auf JEDER Seite – auch mobil (oberhalb der unteren Leiste). */}
      <footer className="border-t border-line px-4 pb-20 pt-4 text-center text-xs text-ink-soft md:pb-4">
        <nav aria-label="Rechtliches" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/datenschutz" className="inline-flex min-h-touch items-center underline underline-offset-2 hover:text-ink">
            Datenschutz
          </Link>
          <Link href="/impressum" className="inline-flex min-h-touch items-center underline underline-offset-2 hover:text-ink">
            Impressum
          </Link>
        </nav>
        <p className="mt-1 hidden md:block">{APP.company} · Handel ist Mannschaftssport. Führung entscheidet das Spiel.</p>
      </footer>

      <CampusNav items={NAV} variant="bottom" />
    </div>
  );
}
