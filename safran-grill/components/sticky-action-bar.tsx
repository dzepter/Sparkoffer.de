import { restaurant } from "@/lib/restaurant-config";
import { NewTabHint } from "./cta";

/**
 * Mobile Sticky Action Bar am unteren Rand: Anrufen, Route, Bestellen.
 * Reine Links, kein JavaScript. Der zugehörige Platzhalter (padding-bottom)
 * liegt im Layout, damit kein Inhalt verdeckt wird.
 */
export function StickyActionBar() {
  const actions = [
    {
      href: `tel:${restaurant.phone.e164}`,
      label: "Anrufen",
      external: false,
      icon: (
        <svg viewBox="0 0 20 20" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5C7.6 17.6 2.4 12.4 2 5.1A1.5 1.5 0 0 1 3.5 3.5Z" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: restaurant.links.googleRoute,
      label: "Route",
      external: true,
      icon: (
        <svg viewBox="0 0 20 20" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 18s6-5.1 6-9.5a6 6 0 1 0-12 0C4 12.9 10 18 10 18Z" strokeLinejoin="round" />
          <circle cx="10" cy="8.5" r="2.2" />
        </svg>
      ),
    },
    {
      href: restaurant.links.lieferando,
      label: "Bestellen",
      external: true,
      icon: (
        <svg viewBox="0 0 20 20" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 6.5h12l-1 9a1.5 1.5 0 0 1-1.5 1.3h-7A1.5 1.5 0 0 1 5 15.5l-1-9Z" strokeLinejoin="round" />
          <path d="M7 6.5V6a3 3 0 0 1 6 0v.5" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Schnellaktionen"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-3 divide-x divide-line">
        {actions.map((a) => (
          <li key={a.label}>
            <a
              href={a.href}
              {...(a.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="flex min-h-12 items-center justify-center gap-2 py-3 text-[0.85rem] font-semibold text-ink transition-colors duration-fast active:bg-cream-deep"
            >
              <span className="text-saffron-deep">{a.icon}</span>
              {a.label}
              {a.external && <NewTabHint />}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
