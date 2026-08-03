"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cta, navigation, routes } from "@/content/site";

/**
 * Header mit schlanker Hauptnavigation.
 * Wird beim Scrollen dezent kompakter und bleibt erreichbar.
 */
export function Header() {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /*
   * Offenes Mobilmenü: Escape schließt (Fokus zurück zum Button),
   * Tab bleibt innerhalb von Menü-Button und Menü (Fokusfalle),
   * Hintergrund-Scroll ist gesperrt.
   */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      const toggle = toggleRef.current;
      if (!panel || !toggle) return;
      const focusable = [
        toggle,
        ...panel.querySelectorAll<HTMLElement>("a[href], button"),
      ];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (active instanceof HTMLElement && !focusable.includes(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur transition-all duration-300 ${
        compact ? "shadow-sm" : ""
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href={routes.home}
          className={`flex shrink-0 items-center transition-all duration-300 ${
            compact ? "py-2" : "py-3 sm:py-4"
          }`}
        >
          <Image
            src="/images/logo-aigner-offensiv.png"
            alt="Aigner Offensiv – Startseite"
            width={1092}
            height={428}
            sizes="140px"
            className={`w-auto mix-blend-multiply transition-all duration-300 ${
              compact ? "h-9" : "h-11 sm:h-13"
            }`}
          />
        </Link>

        {/* Desktop-Navigation */}
        <nav aria-label="Hauptnavigation" className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {navigation.map((item) => {
              const active =
                item.href === pathname ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`font-display text-[0.9375rem] font-medium uppercase tracking-wider transition-colors hover:text-rot ${
                      active ? "text-rot" : "text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={cta.primary.href}
            className="hidden min-h-11 items-center bg-rot px-5 py-2.5 font-display text-[0.9375rem] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-rot-dark sm:inline-flex"
          >
            {cta.primary.label}
          </Link>

          {/* Mobile: Menü-Button */}
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">
              {open ? "Menü schließen" : "Menü öffnen"}
            </span>
            <svg
              aria-hidden="true"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {open ? (
                <>
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="border-t border-line bg-paper lg:hidden"
      >
        <nav aria-label="Mobile Navigation" className="px-5 py-4">
          <ul className="flex flex-col">
            {navigation.map((item) => {
              const active =
                item.href === pathname ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <li key={item.href} className="border-b border-line last:border-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`block py-4 font-display text-lg font-medium uppercase tracking-wider ${
                      active ? "text-rot" : "text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={cta.primary.href}
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex w-full min-h-12 items-center justify-center bg-rot px-5 py-3 font-display font-semibold uppercase tracking-wider text-white"
          >
            {cta.primary.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
