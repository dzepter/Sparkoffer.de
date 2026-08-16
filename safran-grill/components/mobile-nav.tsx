"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

/**
 * Mobiles Menü – einzige Client-Komponente der Website.
 * Öffnet ein kompaktes Overlay unter dem Header; schließt bei
 * Navigation und bei Escape.
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="-mr-2 flex h-11 w-11 items-center justify-center text-ink"
      >
        <span className="sr-only">{open ? "Menü schließen" : "Menü öffnen"}</span>
        <span aria-hidden className="relative block h-3.5 w-5">
          <span
            className={`absolute left-0 top-0 h-px w-full bg-current transition-transform duration-fast ${
              open ? "top-1/2 rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-1/2 h-px w-full bg-current transition-opacity duration-fast ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`absolute left-0 bottom-0 h-px w-full bg-current transition-transform duration-fast ${
              open ? "bottom-1/2 -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full border-b border-line bg-cream"
        >
          <nav aria-label="Hauptnavigation mobil" className="px-5 py-4">
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className="block py-3.5 text-lg font-medium text-ink"
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={orderHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-3.5 text-lg font-medium text-saffron-deep"
                >
                  Online bestellen{" "}
                  <span aria-hidden className="text-base">
                    ↗
                  </span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
