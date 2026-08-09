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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-paper text-ink">{children}</body>
    </html>
  );
}
