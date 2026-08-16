import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/restaurant-config";

/** Nur echte, kanonische, indexierbare Seiten. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/speisekarte", priority: 0.9 },
    { path: "/buffet", priority: 0.9 },
    { path: "/ueber-uns", priority: 0.6 },
    { path: "/kontakt", priority: 0.8 },
    { path: "/impressum", priority: 0.2 },
    { path: "/datenschutz", priority: 0.2 },
  ];

  return pages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: page.priority,
  }));
}
