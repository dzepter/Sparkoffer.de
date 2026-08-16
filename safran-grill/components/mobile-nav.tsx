"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fullAddress, restaurant } from "@/lib/restaurant-config";
import { NewTabHint } from "./cta";

interface NavItem {
  href: string;
  label: string;
}

/**
 * Mobiles Menü als dunkles Fullscreen-Overlay: große Navigation,
 * Bestell-CTA und Adresse. Schließt bei Navigation und Escape;
 * Scroll wird gesperrt, solange es offen ist.
 */
export function MobileNav({
  items,
  orderHref,
}: {
  items: NavItem[];
  orderHref: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`z-20 flex h-12 w-12 items-center justify-center ${
          open ? "fixed right-3 top-3 text-paper" : "relative -mr-2 text-ink"
        }`}
      >
        <span className="sr-only">{open ? "Menü schließen" : "Menü öffnen"}</span>
        <span aria-hidden className="relative block h-3.5 w-6">
          <span
            className={`absolute left-0 top-0 h-0.5 w-full bg-current transition-transform duration-fast ${
              open ? "top-1/2 rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-1/2 h-0.5 w-full bg-current transition-opacity duration-fast ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`absolute left-0 bottom-0 h-0.5 w-full bg-current transition-transform duration-fast ${
              open ? "bottom-1/2 -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {open && (
        <div id={panelId} className="fixed inset-0 z-10 flex flex-col bg-coal">
          <div className="flex h-[4.5rem] shrink-0 items-center border-b border-line-dark px-5">
            <span className="font-display display-black text-xl font-bold uppercase text-paper">
              Safran
            </span>
          </div>
          <nav aria-label="Hauptnavigation mobil" className="flex-1 overflow-y-auto px-5 py-8">
            <ul>
              {items.map((item, i) => (
                <li key={item.href} className="border-b border-line-dark">
                  <Link
                    href={item.href}
                    onClick={close}
                    className="flex items-baseline gap-4 py-5"
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    <span aria-hidden className="text-[0.7rem] font-semibold tabular-nums text-saffron-bright">
                      0{i + 1}
                    </span>
                    <span
                      className={`font-display text-3xl font-semibold ${
                        pathname === item.href ? "text-saffron-bright" : "text-paper"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href={orderHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-saffron-bright px-7 text-[1rem] font-semibold text-coal"
            >
              Online bestellen <span aria-hidden className="ml-2">↗</span>
              <NewTabHint />
            </a>
          </nav>
          <p className="shrink-0 border-t border-line-dark px-5 py-4 text-[0.85rem] text-paper/60">
            {fullAddress} ·{" "}
            <a href={`tel:${restaurant.phone.e164}`} className="text-paper/80">
              {restaurant.phone.display}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
