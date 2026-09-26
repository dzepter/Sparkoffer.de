import type { Metadata } from "next";
import type { ReactNode } from "react";

import { APP } from "@handel-offensiv/config";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${APP.name} – Cockpit`,
    template: `%s – ${APP.name} Cockpit`,
  },
  description: `Administration des digitalen Mannschaftsraums von ${APP.company}.`,
  robots: { index: false, follow: false },
};

/**
 * CSP mit Nonce (src/middleware.ts, script-src 'nonce-…' 'strict-dynamic'):
 * Next traegt den Nonce nur in DYNAMISCH gerenderte Seiten ein. Statisch
 * vorgerenderte Routen (/hinweis-app, /login/passwort-vergessen, 404) haetten
 * Skripte ohne Nonce – der Browser blockierte sie komplett (keine Hydration).
 * Daher wird das gesamte Cockpit dynamisch gerendert (gilt fuer alle Segmente
 * unter diesem Root-Layout inkl. not-found.tsx).
 */
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-paper text-ink">{children}</body>
    </html>
  );
}
