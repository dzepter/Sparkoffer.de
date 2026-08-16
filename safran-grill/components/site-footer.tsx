import Link from "next/link";
import { fullAddress, restaurant } from "@/lib/restaurant-config";
import { Wordmark } from "./wordmark";

export function SiteFooter() {
  return (
    <footer className="border-t border-line-dark bg-espresso text-cream">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark onDark />
            <address className="mt-4 text-[0.95rem] not-italic leading-relaxed text-cream/75">
              {restaurant.address.street}
              <br />
              {restaurant.address.zip} {restaurant.address.city}
            </address>
            <p className="mt-3 text-[0.95rem]">
              <a
                href={`tel:${restaurant.phone.e164}`}
                className="text-cream/90 underline-offset-4 transition-colors duration-fast hover:text-cream hover:underline"
              >
                {restaurant.phone.display}
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-[0.72rem] font-semibold uppercase tracking-eyebrow text-cream/50">
              Öffnungszeiten
            </h2>
            <ul className="mt-4 space-y-1 text-[0.95rem] text-cream/75">
              <li>Mo &amp; Mi–So: 11:00–22:00 Uhr</li>
              <li>Dienstag: Ruhetag</li>
            </ul>
          </div>

          <div>
            <h2 className="text-[0.72rem] font-semibold uppercase tracking-eyebrow text-cream/50">
              Entdecken
            </h2>
            <ul className="mt-4 space-y-2 text-[0.95rem]">
              <li>
                <Link href="/speisekarte" className="text-cream/75 transition-colors duration-fast hover:text-cream">
                  Speisekarte
                </Link>
              </li>
              <li>
                <Link href="/buffet" className="text-cream/75 transition-colors duration-fast hover:text-cream">
                  All-you-can-eat-Buffet
                </Link>
              </li>
              <li>
                <a
                  href={restaurant.links.lieferando}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cream/75 transition-colors duration-fast hover:text-cream"
                >
                  Bei Lieferando bestellen <span aria-hidden>↗</span>
                </a>
              </li>
              <li>
                <a
                  href={restaurant.links.googleRoute}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cream/75 transition-colors duration-fast hover:text-cream"
                >
                  Route öffnen <span aria-hidden>↗</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[0.72rem] font-semibold uppercase tracking-eyebrow text-cream/50">
              Rechtliches
            </h2>
            <ul className="mt-4 space-y-2 text-[0.95rem]">
              <li>
                <Link href="/impressum" className="text-cream/75 transition-colors duration-fast hover:text-cream">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="text-cream/75 transition-colors duration-fast hover:text-cream">
                  Datenschutz
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-12 border-t border-line-dark pt-6 text-[0.85rem] text-cream/50">
          Safran Grill · {fullAddress}
        </p>
      </div>
    </footer>
  );
}
