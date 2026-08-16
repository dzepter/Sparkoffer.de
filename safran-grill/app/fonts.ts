import localFont from "next/font/local";

/**
 * Lokal gehostete Variable Fonts (keine externen Font-Requests).
 * Fraunces: charaktervolle Serif für ausgewählte Headlines.
 * Instrument Sans: sehr gut lesbare Sans für Navigation, Text, Speisekarte.
 */
export const fraunces = localFont({
  src: "./fonts/fraunces-latin-wght-normal.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-fraunces",
  fallback: ["Georgia", "serif"],
});

export const instrumentSans = localFont({
  src: "./fonts/instrument-sans-latin-wght-normal.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-instrument-sans",
  fallback: ["system-ui", "sans-serif"],
});
