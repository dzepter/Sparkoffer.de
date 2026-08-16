"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Desktop-Navigationslinks mit Kennzeichnung der aktuellen Seite
 * (aria-current + visueller Zustand).
 */
export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`text-[0.95rem] font-medium transition-colors duration-fast ${
              active
                ? "text-ink underline decoration-saffron decoration-2 underline-offset-8"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
