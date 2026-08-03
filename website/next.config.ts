import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },

  /**
   * Weiterleitungen der bisherigen WordPress-URLs auf die neue Struktur.
   * Zuordnung nach inhaltlicher Nähe (siehe README, Abschnitt Migration):
   *  – LEARN-TO-LEAD und alte Führungsseiten → Handel Offensiv
   *  – Vortragsseite und Blog-Inhalte → Impulse
   *  – Über-uns-Seite → Rainer Aigner
   *  – Coaching-/Potenzialseite → Für Unternehmen
   */
  async redirects() {
    return [
      { source: "/learn-to-lead", destination: "/handel-offensiv", permanent: true },
      { source: "/fuhrung-leicht-gemacht", destination: "/handel-offensiv", permanent: true },
      { source: "/generation-y", destination: "/handel-offensiv", permanent: true },
      { source: "/potentiale-steuern", destination: "/fuer-unternehmen", permanent: true },
      { source: "/uber-uns", destination: "/rainer-aigner", permanent: true },
      { source: "/vortraege", destination: "/impulse", permanent: true },
      { source: "/blog", destination: "/impulse", permanent: true },
      { source: "/category/:slug*", destination: "/impulse", permanent: true },
      {
        source:
          "/krisensituationen-brauchen-echte-fuehrung-und-keinen-populismus",
        destination: "/impulse",
        permanent: true,
      },
      { source: "/das-wohlstandsproblem-loesen", destination: "/impulse", permanent: true },
      {
        source:
          "/abkuerzungen-der-schnellste-weg-nach-oben-geht-ueber-entrepreneurship",
        destination: "/impulse",
        permanent: true,
      },
      {
        source:
          "/abkuerzungen-ueber-das-fast-perfekte-gespraech-zu-besseren-jobs",
        destination: "/impulse",
        permanent: true,
      },
      {
        source:
          "/abkuerzungen-verhaltensregeln-als-grundlage-fuer-mehr-erfolg-im-beruf",
        destination: "/impulse",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
