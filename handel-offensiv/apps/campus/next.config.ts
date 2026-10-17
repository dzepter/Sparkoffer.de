import type { NextConfig } from "next";

/**
 * Pfad-Praefix der Akademie (Zielstruktur Version 1):
 *   https://www.handel-offensiv.de/akademie  -> diese App (Zone "akademie")
 *   https://www.handel-offensiv.de/login     -> Rewrite der Website-Shell
 *                                              (apps/web) auf /akademie/login
 * Alle Links, Redirects und Assets erhalten das Praefix automatisch
 * (next/link, redirect(), request.nextUrl). Absolute URLs (Auth-Mails)
 * kommen aus NEXT_PUBLIC_APP_URL und enthalten das Praefix bereits.
 */
export const BASE_PATH = "/akademie";

/**
 * Sicherheits-Header fuer den Campus (noindex: der Campus ist nie oeffentlich
 * indexierbar). Die Content-Security-Policy wird in src/middleware.ts mit
 * Nonce gesetzt (Next.js-Empfehlung), damit keine 'unsafe-inline'-Skripte
 * noetig sind.
 */
const securityHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/**
 * Oeffentliche Hosts, von denen Server Actions (Formulare) angenommen werden.
 * Die Akademie wird ueber die Website-Shell (Rewrite) ausgeliefert; der
 * Browser sendet dabei als Origin den Host der Website (www.handel-offensiv.de),
 * waehrend diese App unter ihrem Vercel-Host antwortet. Ohne Freigabe lehnt
 * Next solche Formular-Absendungen als Cross-Origin ab.
 * Konfiguration: SERVER_ACTIONS_ALLOWED_ORIGINS="www.handel-offensiv.de,handel-offensiv.de"
 * (Staging: der Host der Shell-Vorschau). Lokal: die Shell auf Port 3100.
 */
const allowedOrigins = (process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "localhost:3100")
  .split(",")
  .map((h) => h.trim())
  .filter((h) => h !== "");

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  /**
   * Workspace-Packages liegen als TypeScript-Quellen vor (main -> src/index.ts)
   * und muessen von Next transpiliert werden.
   */
  transpilePackages: [
    "@handel-offensiv/types",
    "@handel-offensiv/validation",
    "@handel-offensiv/domain",
    "@handel-offensiv/config",
    "@handel-offensiv/ui",
  ],
  poweredByHeader: false,
  experimental: {
    serverActions: { allowedOrigins },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
