import Link from "next/link";

import { cn } from "@handel-offensiv/ui";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { loadUnreadCount } from "./data";

/**
 * Hinweis "Neue Benachrichtigungen" – kleine Server-Komponente, die das
 * Layout oder HEUTE spaeter einbinden kann. Liest die Anzahl ungelesener
 * Benachrichtigungen im NUTZER-Kontext (RLS) und rendert nichts, wenn es
 * nichts Neues gibt.
 *
 *  - variant "pill": kompakte Zahl (z. B. neben dem Navigationspunkt)
 *  - variant "card": Hinweiskarte mit Link zu /nachrichten (z. B. auf HEUTE)
 */
export async function UnreadBadge({ variant = "pill", className }: { variant?: "pill" | "card"; className?: string }) {
  const supabase = await createSupabaseServerClient();
  const count = await loadUnreadCount(supabase);
  if (count === 0) return null;

  const label = count === 1 ? "1 neue Benachrichtigung" : `${count} neue Benachrichtigungen`;

  if (variant === "card") {
    return (
      <Link
        href="/nachrichten"
        className={cn(
          "flex min-h-touch items-center justify-between gap-3 rounded border border-line border-l-[3px] border-l-gold bg-white px-4 py-3 text-sm hover:bg-paper",
          className,
        )}
      >
        <span className="font-bold text-ink">{label}</span>
        <span className="text-xs font-bold uppercase tracking-kicker text-gold-deep">Ansehen ›</span>
      </Link>
    );
  }

  return (
    <span
      aria-label={label}
      title={label}
      className={cn("inline-flex min-w-[20px] items-center justify-center rounded-pill bg-gold-bright px-1.5 py-0.5 text-[11px] font-bold leading-none text-navy", className)}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
