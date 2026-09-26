import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { APP } from "@handel-offensiv/config";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${APP.name} Campus`,
    template: `%s – ${APP.name} Campus`,
  },
  description: `Der digitale Mannschaftsraum zum Präsenzprogramm ${APP.name} von ${APP.company}.`,
  // Der Campus ist nie oeffentlich indexierbar (zusaetzlich X-Robots-Tag im next.config)
  robots: { index: false, follow: false, noarchive: true },
  applicationName: `${APP.name} Campus`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F2340",
};

/**
 * CSP mit Nonce (src/middleware.ts, script-src 'nonce-…' 'strict-dynamic'):
 * Next traegt den Nonce nur in DYNAMISCH gerenderte Seiten ein. Statisch
 * vorgerenderte Routen (z. B. /impressum, /login/passwort-vergessen, 404)
 * haetten Skripte ohne Nonce – der Browser blockierte sie komplett (keine
 * Hydration). Daher wird der gesamte Campus dynamisch gerendert; das gilt
 * fuer alle Segmente unter diesem Root-Layout inkl. not-found.tsx.
 */
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-paper text-ink">{children}</body>
    </html>
  );
}
