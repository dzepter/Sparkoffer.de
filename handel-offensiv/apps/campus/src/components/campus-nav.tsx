"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@handel-offensiv/ui";

export interface NavItem {
  href: string;
  label: string;
  /** Kurzlabel fuer die mobile Leiste */
  short?: string;
}

/** Sichtbarer Fokusring auf Navy (der globale Navy-Ring waere hier unsichtbar). */
export const FOCUS_ON_NAVY =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-navy";

/** Hauptnavigation: Desktop im Header, mobil als untere Leiste. Aktiv = Gold. */
export function CampusNav({ items, variant }: { items: NavItem[]; variant: "header" | "bottom" }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  if (variant === "bottom") {
    return (
      <nav aria-label="Hauptnavigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line-dark bg-navy md:hidden">
        <ul className="flex">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[56px] flex-col items-center justify-center gap-1 rounded px-1 text-[11px] font-bold uppercase tracking-wide",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-bright",
                    active ? "text-gold-bright" : "text-paper/70 hover:text-paper",
                  )}
                >
                  <span aria-hidden="true" className={cn("h-0.5 w-6 rounded", active ? "bg-gold-bright" : "bg-transparent")} />
                  {item.short ?? item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Hauptnavigation" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-touch items-center rounded-sm border-b-2 px-3 text-xs font-bold uppercase tracking-kicker transition-colors",
                  FOCUS_ON_NAVY,
                  active ? "border-gold-bright text-gold-bright" : "border-transparent text-paper/80 hover:text-paper",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
