import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteConfig } from "@/content/site";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-oswald",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Handel Offensiv | Führungskräfteentwicklung für den Handel",
    template: `%s | ${siteConfig.brand}`,
  },
  description:
    "Der Führungsführerschein für Marktleiter, Filialleiter und Abteilungsleiter. Fünf praxisnahe Offensivtage – persönlich und zu 100 Prozent in Präsenz.",
  openGraph: {
    siteName: siteConfig.brand,
    locale: "de_DE",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15171c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${oswald.variable} ${inter.variable}`}>
      <head>
        {/* Kennzeichnet verfügbares JavaScript für Einblend-Animationen –
            ohne JS bleiben alle Inhalte sofort sichtbar. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-rot focus:px-4 focus:py-2 focus:text-white"
        >
          Zum Inhalt springen
        </a>
        <Header />
        <main id="inhalt" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
