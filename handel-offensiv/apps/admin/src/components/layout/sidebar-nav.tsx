"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

export interface NavItem {
  href: string;
  label: string;
}

export interface NavGroup {
  /** Gruppen-Label (VERSAL), null = Hauptnavigation ohne Label */
  label: string | null;
  items: NavItem[];
}

export function SidebarNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  const isActive = (href: string): boolean =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Hauptnavigation" className="flex flex-col gap-6">
      {groups.map((group, i) => (
        <div key={group.label ?? `gruppe-${i}`}>
          {group.label ? (
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-kicker text-paper/50">
              {group.label}
            </p>
          ) : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-touch items-center gap-2 rounded px-3 text-sm font-bold uppercase tracking-kicker transition-colors",
                      active
                        ? "bg-green text-dark"
                        : "text-paper/80 hover:bg-dark-2 hover:text-paper",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "font-extrabold",
                        active ? "text-dark" : "text-green-bright",
                      )}
                    >
                      /
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
