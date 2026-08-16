import Link from "next/link";
import { fullAddress, restaurant } from "@/lib/restaurant-config";
import { NewTabHint } from "./cta";
import { Wordmark } from "./wordmark";

export function SiteFooter() {
  return (
    <footer className="bg-coal text-paper">
      <div className="mx-auto max-w-[85rem] px-5 pb-12 pt-16 sm:px-8 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Wordmark onDark size="footer" />
            <address className="mt-6 max-w-xs text-[0.95rem] not-italic leading-relaxed text-paper/70">
              {restaurant.address.street}
              <br />
              {restaurant.address.zip} {restaurant.address.city}
            </address>
            <p className="mt-3 text-[0.95rem]">
              <a
                href={`tel:${restaurant.phone.e164}`}
                className="font-semibold text-paper underline-offset-4 transition-colors duration-fast hover:underline"
              >
                {restaurant.phone.display}
              </a>
            </p>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-saffron-bright">
              Öffnungszeiten
            </h2>
            <ul className="mt-4 space-y-1 text-[0.95rem] text-paper/70">
              {restaurant.openingHoursCompact.split(" · ").map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-saffron-bright">
              Entdecken
            </h2>
            <ul className="mt-4 space-y-2.5 text-[0.95rem]">
              <li>
                <Link href="/speisekarte" className="inline-block py-1 text-paper/70 transition-colors duration-fast hover:text-paper">
                  Speisekarte
                </Link>
              </li>
              <li>
                <Link href="/buffet" className="inline-block py-1 text-paper/70 transition-colors duration-fast hover:text-paper">
                  Buffet
                </Link>
              </li>
              <li>
                <a
                  href={restaurant.links.lieferando}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-1 text-paper/70 transition-colors duration-fast hover:text-paper"
                >
                  Lieferando <span aria-hidden>↗</span>
                  <NewTabHint />
                </a>
              </li>
              <li>
                <a
                  href={restaurant.links.googleRoute}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-1 text-paper/70 transition-colors duration-fast hover:text-paper"
                >
                  Route <span aria-hidden>↗</span>
                  <NewTabHint />
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-saffron-bright">
              Rechtliches
            </h2>
            <ul className="mt-4 space-y-2.5 text-[0.95rem]">
              <li>
                <Link href="/impressum" className="inline-block py-1 text-paper/70 transition-colors duration-fast hover:text-paper">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="inline-block py-1 text-paper/70 transition-colors duration-fast hover:text-paper">
                  Datenschutz
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-line-dark pt-6 text-[0.8rem] text-paper/50">
          <p>Safran Grill · {fullAddress}</p>
          <p aria-hidden className="uppercase tracking-[0.25em]">
            Neustadt <span className="text-saffron-bright">·</span> 67433
          </p>
        </div>
      </div>
    </footer>
  );
}
