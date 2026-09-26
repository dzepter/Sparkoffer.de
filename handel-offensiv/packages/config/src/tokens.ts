/**
 * Aigner Offensiv Design Tokens – Palette v2 (Freigabe K-7, 26.09.2026).
 *
 * Verbindlich:
 *  - tiefes Dunkelblau/Navy als Hauptfarbe
 *  - Off-White fuer Text und Flaechen
 *  - warmer Gold-/Ocker-Akzent SEHR SPARSAM: Modulnummern 01–05, aktive
 *    Navigation, wichtige CTA, Fortschritt, dezente Taktiklinien, ausgewaehlte
 *    Hervorhebungen. Keine luxurioese Goldoptik, kein Gradient-Overkill,
 *    kein generisches SaaS-Blau.
 *
 * Alle Paare sind gegen WCAG AA geprueft (docs/DESIGN_TOKENS.md, Tabelle).
 * Die App verwendet bewusst einen expliziten Light Mode (kein System-Dark-Mode).
 *
 * Vergleich mit der bestehenden handel-offensiv.de (assets/css/style.css):
 * dort Navy #101C2A/#16263A + Blau-Akzent #2E6FB0, Off-White #F5F7F9.
 * Navy und Off-White werden uebernommen (leicht waermer), der Blau-Akzent wird
 * durch den Gold-/Ocker-Akzent ersetzt. Endgueltige Feinabstimmung nach dem
 * Sichtvergleich mit der Live-Website (Phase 1, Zwischenbericht G).
 */

export const colors = {
  /** Hauptfarbe – Header, dunkle Flaechen, primaere Aktionen (Text darauf: white/paper) */
  navy: "#0F2340",
  /** Tiefstes Navy – Seitenhintergrund dunkler Bereiche, Footer */
  navyDeep: "#0A182E",
  /** Aufgehelltes Navy – Karten/erhoehte Flaechen auf dunklem Grund */
  navySoft: "#1B3A66",
  /** Warmes Off-White – Seitengrund */
  paper: "#F6F4EE",
  /** Etwas dunkleres Off-White – ruhige Flaechen, Zebra-Zeilen */
  paperDeep: "#ECE9E1",
  /** Reines Weiss – Karten auf hellem Grund */
  white: "#FFFFFF",
  /** Primaere Textfarbe */
  ink: "#141B26",
  /** Sekundaere Textfarbe (AA auf paper und white) */
  inkSoft: "#4F5866",
  /** Hairlines und Rahmen auf hellem Grund */
  line: "#E2DFD6",
  /** Hairlines auf dunklem Grund */
  lineDark: "#24395C",
  /** Gold-/Ocker-Akzent – Flaechen, Linien, grosse Zahlen (>= 3:1 auf paper) */
  gold: "#AD8027",
  /** Gold fuer Fliesstext-Groessen auf hellem Grund (>= 4.5:1 auf paper) */
  goldDeep: "#8A6414",
  /** Gold auf Navy (Modulnummern, aktive Navigation im Header) */
  goldBright: "#D9AE45",
  /** Semantik – unabhaengig vom Markenakzent */
  success: "#2E7D4F",
  warning: "#985A07",
  danger: "#B03A2E",

  // --- Kompatibilitaets-Aliasse (Palette v1, werden schrittweise entfernt) ---
  /** @deprecated -> goldBright (CTA-Flaeche mit Navy-Text, >= 4.5:1) */
  green: "#D9AE45",
  /** @deprecated -> goldBright (Akzent auf dunklem Grund) */
  greenBright: "#D9AE45",
  /** @deprecated -> goldDeep (Text auf hellem Grund) */
  greenDeep: "#8A6414",
  /** @deprecated -> navy */
  dark: "#0F2340",
  /** @deprecated -> navySoft */
  dark2: "#1B3A66",
} as const;

export const typography = {
  /** Archivo wird lokal gebuendelt (kein Google-Fonts-CDN, DSGVO). */
  family: "Archivo",
  familyFallback: "System",
  /** Modulnummern 01–05, Hero-Zahlen (in Gold) */
  display: { fontSize: 56, fontWeight: "800" as const, letterSpacing: -0.5 },
  h1: { fontSize: 28, fontWeight: "800" as const },
  h2: { fontSize: 22, fontWeight: "700" as const },
  h3: { fontSize: 17, fontWeight: "700" as const },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  small: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  /** Eyebrow-Label, VERSAL mit Letterspacing */
  kicker: { fontSize: 12, fontWeight: "700" as const, letterSpacing: 1.8 },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  /** Bewusst kantig – 2px wie auf der Website */
  base: 2,
  pill: 999,
} as const;

export const motion = {
  /** Reduzierte, ruhige Bewegungen; prefers-reduced-motion respektieren */
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export const touch = {
  /** Mindestgroesse fuer Touch-Targets (Accessibility §36) */
  minTarget: 44,
} as const;

/**
 * Einsatzregeln fuer den Gold-Akzent (maschinenlesbar fuer Reviews/Linting).
 * Alles, was hier NICHT steht, verwendet Navy/Ink/Off-White.
 */
export const GOLD_USAGE = [
  "module-number",
  "nav-active",
  "cta-primary",
  "progress",
  "tactic-line",
  "highlight",
] as const;
