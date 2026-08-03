import type { Metadata } from "next";
import { siteConfig } from "@/content/site";

/**
 * Einheitliche Metadaten pro Seite.
 * Da Next.js verschachtelte metadata-Objekte nicht tief zusammenführt,
 * liefert dieser Helper immer einen VOLLSTÄNDIGEN openGraph-Block
 * (inkl. Bild, siteName, locale, type).
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  /** Vollständiger Titel (ohne automatisches Brand-Suffix). */
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: siteConfig.brand,
      locale: "de_DE",
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "Handel Offensiv – Der Führungsführerschein für den Handel",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}
