import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { APP } from "@handel-offensiv/config";
import { can } from "@handel-offensiv/domain";

import { SidebarNav, type NavGroup } from "@/components/layout/sidebar-nav";
import { displayName, getActorContext, isCockpitActor } from "@/lib/auth";

/**
 * Cockpit-Rahmen: dunkle Seitenleiste (Navigation §55), helle Arbeitsflaeche.
 * Rollen-Gate: reine Teilnehmer werden auf /hinweis-app geleitet.
 * (can() ist UX – verbindlich bleibt RLS in der Datenbank.)
 */
export default async function CockpitLayout({ children }: { children: ReactNode }) {
  const session = await getActorContext();
  if (!session) redirect("/login");

  const { actor, profile, email } = session;
  if (!isCockpitActor(actor)) redirect("/hinweis-app");

  const groups: NavGroup[] = [
    {
      label: null,
      items: [
        { href: "/", label: "Übersicht" },
        { href: "/unternehmen", label: "Unternehmen" },
        { href: "/gruppen", label: "Gruppen" },
        { href: "/teilnehmer", label: "Teilnehmer" },
        { href: "/programme", label: "Programme" },
        { href: "/inhalte", label: "Inhalte" },
        { href: "/termine", label: "Termine" },
        { href: "/nachrichten", label: "Nachrichten" },
        { href: "/auswertung", label: "Auswertung" },
      ],
    },
  ];

  // SYSTEM-Gruppe nur fuer Super Admins (settings.manage)
  if (can(actor, "settings.manage")) {
    groups.push({
      label: "System",
      items: [
        { href: "/system/benutzer", label: "Benutzer & Rollen" },
        { href: "/system/audit", label: "Audit Log" },
        { href: "/system/einstellungen", label: "Einstellungen" },
      ],
    });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="pitch-lines-dark flex w-64 shrink-0 flex-col border-r border-line-dark bg-dark px-3 py-6">
        <div className="mb-8 px-3">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-kicker text-paper/50">
            <span aria-hidden="true" className="font-extrabold text-green-bright">
              //
            </span>
            {APP.company}
          </p>
          <p className="mt-1 text-lg font-extrabold uppercase leading-tight tracking-tight text-paper">
            {APP.name}
          </p>
        </div>

        <SidebarNav groups={groups} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-line bg-white px-8 py-3">
          <span className="text-sm text-ink-soft">
            Angemeldet als{" "}
            <span className="font-bold text-ink">{displayName(profile, email)}</span>
          </span>
          <form action="/logout" method="post">
            <button
              type="submit"
              className="inline-flex min-h-touch items-center rounded px-3 text-sm font-bold uppercase tracking-kicker text-ink-soft hover:bg-paper hover:text-ink"
            >
              Abmelden
            </button>
          </form>
        </header>

        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
