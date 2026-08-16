"use client";

import { useEffect, useRef, useState } from "react";

interface MenuNavItem {
  id: string;
  title: string;
}

/**
 * Sticky Kategorie-Navigation der Speisekarte mit Scroll-Spy
 * (IntersectionObserver). Die aktive Kategorie wird hervorgehoben und
 * auf Mobile automatisch in den sichtbaren Bereich gescrollt.
 */
export function MenuNav({ items }: { items: MenuNavItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
          else visible.delete(entry.target.id);
        }
        // Oberste sichtbare Sektion gewinnt
        let current: string | null = null;
        for (const section of sections) {
          if (visible.has(section.id)) {
            current = section.id;
            break;
          }
        }
        if (current) setActive(current);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: [0, 0.1] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  // Aktiven Link in der horizontal scrollbaren Leiste sichtbar halten
  useEffect(() => {
    if (!active || !listRef.current) return;
    const link = listRef.current.querySelector<HTMLAnchorElement>(`a[href="#${active}"]`);
    link?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [active]);

  return (
    <nav
      aria-label="Speisekarten-Kategorien"
      className="sticky top-[4.5rem] z-30 border-b border-line bg-cream md:top-20"
    >
      <div className="scrollbar-slim mx-auto max-w-[85rem] overflow-x-auto px-5 sm:px-8 lg:overflow-visible">
        <ul
          ref={listRef}
          className="flex gap-x-6 whitespace-nowrap text-[0.9rem] font-semibold lg:flex-wrap"
        >
          {items.map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`inline-flex min-h-12 items-center transition-colors duration-fast ${
                    isActive
                      ? "text-saffron-deep underline decoration-saffron decoration-2 underline-offset-8"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {item.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
