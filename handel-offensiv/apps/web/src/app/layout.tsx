import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Root-Layout der Website-Shell (von Next verlangt). Die eigentliche Website
 * liegt als statische Dateien in public/ (index.html, kontakt.html, …), die
 * 404-Seite liefert src/app/[...rest]/route.ts aus public/404.html – beides
 * laeuft an diesem Layout vorbei. Es wird nur fuer Next-interne Seiten
 * (/_not-found) verwendet.
 */
export const metadata: Metadata = {
  title: "HANDEL OFFENSIV | Aigner Offensiv",
  robots: { index: false, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
