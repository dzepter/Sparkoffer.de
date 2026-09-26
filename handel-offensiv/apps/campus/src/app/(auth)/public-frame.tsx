import Link from "next/link";
import type { ReactNode } from "react";

import { APP } from "@handel-offensiv/config";
import { Kicker, cn } from "@handel-offensiv/ui";

/**
 * Oeffentlicher Rahmen (ohne Sitzung): Navy-Kopfleiste mit Firmen-Kicker,
 * Off-White-Flaeche mit dezenten Taktiklinien, Fusszeile mit Rechtslinks.
 * Wird von der (auth)-Gruppe sowie /datenschutz und /impressum verwendet.
 */
export function PublicFrame({
  children,
  width = "narrow",
}: {
  children: ReactNode;
  /** narrow = Formularkarte (max-w-sm), wide = Textseiten (max-w-3xl) */
  width?: "narrow" | "wide";
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="pitch-lines-dark border-b border-line-dark bg-navy text-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/login" className="min-w-0 leading-tight">
            <span className="block text-[10px] font-bold uppercase tracking-kicker text-gold-bright">{APP.company}</span>
            <span className="block truncate text-base font-extrabold uppercase tracking-tight text-paper">
              {APP.name} <span className="font-medium text-paper/70">Campus</span>
            </span>
          </Link>
          <span className="hidden text-xs text-paper/70 sm:inline">{APP.claim}</span>
        </div>
      </header>

      <main className="pitch-lines flex flex-1 flex-col items-center px-4 py-10 sm:py-14">
        <div className={cn("w-full", width === "narrow" ? "max-w-sm" : "max-w-3xl")}>{children}</div>
      </main>

      <footer className="border-t border-line py-5 text-center text-xs text-ink-soft">
        <nav aria-label="Rechtliches" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/datenschutz" className="inline-flex min-h-touch items-center underline underline-offset-2 hover:text-ink">
            Datenschutz
          </Link>
          <Link href="/impressum" className="inline-flex min-h-touch items-center underline underline-offset-2 hover:text-ink">
            Impressum
          </Link>
          <a
            href={`mailto:${APP.supportEmail}`}
            className="inline-flex min-h-touch items-center underline underline-offset-2 hover:text-ink"
          >
            Support: {APP.supportEmail}
          </a>
        </nav>
        <p className="mt-2 px-4">
          {APP.company} · {APP.claim}
        </p>
      </footer>
    </div>
  );
}

/** Kopfbereich einer Auth-Karte: Kicker-Zeile, Titel (Navy), erlaeuternder Satz. */
export function AuthHeading({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6">
      <Kicker>{kicker}</Kicker>
      <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl">{title}</h1>
      {children ? <p className="mt-3 text-sm text-ink-soft">{children}</p> : null}
    </div>
  );
}
