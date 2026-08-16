import type { Metadata } from "next";
import "./globals.css";
import { fraunces, instrumentSans } from "./fonts";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StickyActionBar } from "@/components/sticky-action-bar";
import { JsonLd } from "@/components/json-ld";
import { restaurantJsonLd } from "@/lib/schema";
import { restaurant, siteUrl } from "@/lib/restaurant-config";
import { ogImagePath } from "@/lib/images";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Safran Grill Neustadt | Afghanische Küche & Buffet",
    template: "%s | Safran Grill Neustadt",
  },
  description:
    "Afghanische Spezialitäten, Grillgerichte und Buffet bei Safran Grill in Neustadt an der Weinstraße. Speisekarte ansehen oder direkt vorbeikommen.",
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: restaurant.name,
    images: [
      {
        url: ogImagePath,
        width: 1200,
        height: 630,
        alt: "Gastraum des Safran Grill in Neustadt an der Weinstraße",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${fraunces.variable} ${instrumentSans.variable}`}>
      {/* Padding unten = exakte Höhe der Sticky-Action-Bar (52px + 1px Border)
          plus Safe-Area, damit zwischen Footer und Bar kein heller Streifen bleibt */}
      <body className="flex min-h-svh flex-col pb-[calc(3.3125rem+env(safe-area-inset-bottom))] md:pb-0">
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
        >
          Zum Inhalt springen
        </a>
        <SiteHeader />
        <main id="inhalt" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <StickyActionBar />
        <JsonLd data={restaurantJsonLd()} />
      </body>
    </html>
  );
}
