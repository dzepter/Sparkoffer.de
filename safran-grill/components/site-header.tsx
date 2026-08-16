import Link from "next/link";
import { restaurant } from "@/lib/restaurant-config";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { NewTabHint } from "./cta";
import { Wordmark } from "./wordmark";

const navItems = [
  { href: "/speisekarte", label: "Speisekarte" },
  { href: "/buffet", label: "Buffet" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
];

export function SiteHeader() {
  return (
    // Kein backdrop-blur: backdrop-filter würde den fixed-Backdrop des
    // mobilen Menüs an den Header binden (containing block).
    <header className="sticky top-0 z-50 border-b border-line bg-cream">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="py-2" aria-label="Safran Grill – Startseite">
          <Wordmark />
        </Link>

        <nav aria-label="Hauptnavigation" className="hidden items-center gap-7 md:flex">
          <NavLinks items={navItems} />
          <a
            href={restaurant.links.lieferando}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm bg-saffron-deep px-4.5 py-2.5 text-[0.9rem] font-semibold text-cream transition-colors duration-fast hover:bg-saffron-deeper"
          >
            Online bestellen
            <NewTabHint />
          </a>
        </nav>

        <MobileNav items={navItems} orderHref={restaurant.links.lieferando} />
      </div>
    </header>
  );
}
