import type { MetadataRoute } from "next";
import { routes, siteConfig } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const entries: Array<{ path: string; priority: number }> = [
    { path: routes.home, priority: 1 },
    { path: routes.handelOffensiv, priority: 0.9 },
    { path: routes.offensivtage, priority: 0.9 },
    { path: routes.fuerUnternehmen, priority: 0.8 },
    { path: routes.rainerAigner, priority: 0.7 },
    { path: routes.impulse, priority: 0.6 },
    { path: routes.kontakt, priority: 0.8 },
    { path: routes.impressum, priority: 0.1 },
    { path: routes.datenschutz, priority: 0.1 },
  ];

  return entries.map((entry) => ({
    url: `${siteConfig.url}${entry.path === "/" ? "" : entry.path}`,
    lastModified,
    changeFrequency: "monthly",
    priority: entry.priority,
  }));
}
