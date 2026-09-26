import type { NextConfig } from "next";

/**
 * Website-Shell fuer www.handel-offensiv.de (Zielstruktur Version 1).
 *
 *   /                 statische Website (public/)          – diese App
 *   /login[/…]        Teilnehmer-Login                     – Zone "akademie" (apps/campus, basePath /akademie)
 *   /akademie[/…]     geschuetzte Teilnehmer-Akademie      – Zone "akademie"
 *   /admin[/…]        geschuetzter Admin-/Trainerbereich   – Zone "admin"    (apps/admin, basePath /admin)
 *
 * Die Zonen sind eigene Vercel-Projekte (Region fra1). Diese Shell reicht die
 * Pfade per Rewrite (kein Redirect: die Adresse im Browser bleibt
 * www.handel-offensiv.de/…) an die Zonen weiter. Cookies, Sicherheits-Header
 * und die CSP der Zonen laufen unveraendert durch. Es gibt KEINE produktiven
 * Subdomains campus./admin.; die Zonen-Hosts (…vercel.app) sind nur interne
 * Ziele und werden in den Zonen selbst per Middleware nicht separat beworben.
 *
 * Zonen-Ziele (Build-Zeit, ohne Slash am Ende):
 *   AKADEMIE_ZONE_URL  z. B. https://ho-akademie.vercel.app   (lokal: http://localhost:3001)
 *   ADMIN_ZONE_URL     z. B. https://ho-admin.vercel.app      (lokal: http://localhost:3000)
 */
const AKADEMIE = (process.env.AKADEMIE_ZONE_URL ?? "http://localhost:3001").replace(/\/$/, "");
const ADMIN = (process.env.ADMIN_ZONE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Sicherheits-Header der Website (nur fuer Seiten dieser Shell – Zonenpfade
 * sind ausgenommen, damit die Nonce-CSP der Akademie / des Cockpits nicht
 * ueberschrieben wird). Die Website laedt keine Drittanbieter (kein CDN,
 * keine Fonts von Google, kein Tracking): CSP entsprechend eng.
 * style-src 'unsafe-inline': die statische Site nutzt style-Attribute.
 */
const websiteHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Der Catch-all-Handler (src/app/[...rest]/route.ts) liest public/404.html
  // zur Laufzeit – die Datei muss in das Serverless-Bundle (Vercel) mit.
  outputFileTracingIncludes: { "/[...rest]": ["./public/404.html"] },

  async redirects() {
    return [
      // Alte Info-Seite "Anmelden" der statischen Website -> echter Login
      { source: "/login.html", destination: "/login", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
      // Kanonische Login-Adresse ist /login (nicht /akademie/login): Links und
      // Redirects der Akademie tragen intern das Praefix, hier wird es entfernt.
      // Query (?weiter=…, ?hinweis=…) wird von Next automatisch mitgenommen.
      { source: "/akademie/login", destination: "/login", permanent: false },
      { source: "/akademie/login/:path*", destination: "/login/:path*", permanent: false },
    ];
  },

  async rewrites() {
    return {
      beforeFiles: [
        // Startseite aus public/index.html (Next liefert public/ nur bei exaktem Dateipfad)
        { source: "/", destination: "/index.html" },
        // Zone "akademie": Login-Einstieg ohne Praefix, alles Weitere unter /akademie
        { source: "/login", destination: `${AKADEMIE}/akademie/login` },
        { source: "/login/:path*", destination: `${AKADEMIE}/akademie/login/:path*` },
        { source: "/akademie", destination: `${AKADEMIE}/akademie` },
        { source: "/akademie/:path*", destination: `${AKADEMIE}/akademie/:path*` },
        // Zone "admin"
        { source: "/admin", destination: `${ADMIN}/admin` },
        { source: "/admin/:path*", destination: `${ADMIN}/admin/:path*` },
      ],
    };
  },

  async headers() {
    return [
      {
        // Alle Pfade AUSSER den Zonen (deren Antworten bringen eigene Header mit)
        source: "/((?!akademie|admin|login).*)",
        headers: websiteHeaders,
      },
    ];
  },
};

export default nextConfig;
