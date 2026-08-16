import type { Metadata } from "next";
import { ogImage } from "./images";
import { restaurant } from "./restaurant-config";

/**
 * Vollständiger Open-Graph-Block für eine Seite.
 *
 * Next.js ersetzt das openGraph-Objekt des Layouts komplett, sobald eine
 * Seite ein eigenes definiert – deshalb müssen type/locale/siteName/images
 * hier immer mitgeliefert werden.
 */
export function pageOpenGraph(og: {
  url: string;
  title: string;
  description: string;
}): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    locale: "de_DE",
    siteName: restaurant.name,
    images: [ogImage],
    ...og,
  };
}
