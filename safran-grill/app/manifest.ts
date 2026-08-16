import type { MetadataRoute } from "next";
import { restaurant } from "@/lib/restaurant-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: restaurant.name,
    short_name: restaurant.name,
    description: restaurant.tagline,
    start_url: "/",
    display: "browser",
    background_color: "#f8f3ea",
    theme_color: "#f8f3ea",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
