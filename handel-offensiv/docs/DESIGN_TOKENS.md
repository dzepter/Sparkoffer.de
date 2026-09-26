# Design-Tokens v2 – Navy · Off-White · Gold/Ocker

**Stand: 26.09.2026 (Phase 1, Freigabe K‑7).** Quelle im Code: `packages/config/src/tokens.ts` (Werte), `packages/config/tailwind-preset.js` (Tailwind), E-Mail-Spiegel in `supabase/functions/_shared/email-core.ts`.

## 1. Verbindliche Regeln (Freigabe)

- **Hauptfarbe:** tiefes Dunkelblau/Navy.
- **Text und Flächen:** Off-White.
- **Gold-/Ocker-Akzent sehr sparsam** – nur für: Modulnummern 01–05, aktive Navigation, wichtige CTA, Fortschritt, dezente Taktiklinien, ausgewählte Hervorhebungen.
- Keine luxuriöse Goldoptik, kein Gradient-Overkill, kein generisches SaaS-Blau.
- Endgültige Tokens erst nach Sichtvergleich mit der aktuellen Handel-Offensiv-Website (Zwischenbericht G).

## 2. Palette

| Token | Wert | Verwendung |
|---|---|---|
| `navy` | `#0F2340` | Hauptfarbe: Header, dunkle Flächen, Standard-Buttons (Text: white/paper) |
| `navyDeep` | `#0A182E` | Footer, tiefste Fläche |
| `navySoft` | `#1B3A66` | Karten/erhöhte Flächen auf Navy |
| `paper` | `#F6F4EE` | Seitengrund (warmes Off-White) |
| `paperDeep` | `#ECE9E1` | ruhige Flächen, Zebra-Zeilen |
| `white` | `#FFFFFF` | Karten auf hellem Grund |
| `ink` | `#141B26` | Fließtext |
| `inkSoft` | `#4F5866` | Sekundärtext |
| `line` / `lineDark` | `#E2DFD6` / `#24395C` | Hairlines hell / dunkel |
| `gold` | `#AD8027` | Akzentflächen, Linien, Icons, große Zahlen auf Hell (≥ 3:1) |
| `goldDeep` | `#8A6414` | Gold in Textgröße auf Hell (≥ 4.5:1) |
| `goldBright` | `#D9AE45` | Modulnummern, aktive Navigation, wichtige CTA **auf Navy**; CTA-Fläche mit Navy-Text |
| `success` / `warning` / `danger` | `#2E7D4F` / `#985A07` / `#B03A2E` | Semantik |

**Regel für Gold-Buttons:** Gold-Flächen tragen Navy-Text und verwenden `goldBright` (7.56:1). `gold` (#AD8027) ist als Textträger nicht zulässig (Navy darauf 4.42:1, Weiß darauf 3.56:1) – nur für Linien, Icons, große Ziffern.

Kompatibilitäts-Aliasse (`green` → goldBright, `greenBright` → goldBright, `greenDeep` → goldDeep, `dark` → navy, `dark2` → navySoft) bleiben, bis alle Klassen/Verwendungen in Admin und Mobile umbenannt sind (`packages/ui`, Phase 2). Damit rendern bestehende `bg-green text-dark`-Buttons bereits AA-konform.

## 3. Kontrastprüfung (WCAG 2.1 AA, berechnet)

| Paar | Verwendung | Kontrast | Ziel | Ergebnis |
|---|---|---|---|---|
| ink (#141B26) auf paper (#F6F4EE) | Fließtext auf Off-White | 15.72:1 | ≥ 4.5:1 | OK |
| inkSoft (#4F5866) auf paper (#F6F4EE) | Sekundärtext auf Off-White | 6.54:1 | ≥ 4.5:1 | OK |
| navy (#0F2340) auf paper (#F6F4EE) | Navy-Text/Buttons auf Off-White | 14.30:1 | ≥ 4.5:1 | OK |
| goldDeep (#8A6414) auf paper (#F6F4EE) | Gold-Text (Modulnummern, Links) auf Off-White | 4.88:1 | ≥ 4.5:1 | OK |
| gold (#AD8027) auf paper (#F6F4EE) | Gold-Akzent (Linien, Icons, große Zahlen) auf Off-White | 3.24:1 | ≥ 3:1 | OK |
| white (#FFFFFF) auf navy (#0F2340) | Weißer Text auf Navy | 15.73:1 | ≥ 4.5:1 | OK |
| paper (#F6F4EE) auf navy (#0F2340) | Off-White-Text auf Navy | 14.30:1 | ≥ 4.5:1 | OK |
| goldBright (#D9AE45) auf navy (#0F2340) | Gold-Text/Akzent auf Navy | 7.56:1 | ≥ 4.5:1 | OK |
| gold (#AD8027) auf navy (#0F2340) | Gold-Akzent auf Navy | 4.42:1 | ≥ 3:1 | OK |
| gold (#AD8027) auf white (#FFFFFF) | Gold-Akzent (Linien, Icons) auf Weiß | 3.56:1 | ≥ 3:1 | OK |
| navy (#0F2340) auf goldBright (#D9AE45) | Navy-Text auf hellem Gold (CTA) | 7.56:1 | ≥ 4.5:1 | OK |
| white (#FFFFFF) auf success (#2E7D4F) | Weiß auf Erfolg | 5.05:1 | ≥ 4.5:1 | OK |
| white (#FFFFFF) auf warning (#985A07) | Weiß auf Warnung | 5.53:1 | ≥ 4.5:1 | OK |
| white (#FFFFFF) auf danger (#B03A2E) | Weiß auf Gefahr | 6.02:1 | ≥ 4.5:1 | OK |
| success (#2E7D4F) auf paper (#F6F4EE) | Erfolgstext auf Off-White | 4.59:1 | ≥ 4.5:1 | OK |
| warning (#985A07) auf paper (#F6F4EE) | Warntext auf Off-White | 5.02:1 | ≥ 4.5:1 | OK |
| danger (#B03A2E) auf paper (#F6F4EE) | Fehlertext auf Off-White | 5.47:1 | ≥ 4.5:1 | OK |
| inkSoft (#4F5866) auf white (#FFFFFF) | Sekundärtext auf Weiß | 7.19:1 | ≥ 4.5:1 | OK |
| goldBright (#D9AE45) auf navySoft (#1B3A66) | Gold auf erhöhter Navy-Fläche | 5.47:1 | ≥ 4.5:1 | OK |
| white (#FFFFFF) auf navySoft (#1B3A66) | Weiß auf erhöhter Navy-Fläche | 11.39:1 | ≥ 4.5:1 | OK |

Alle 20 Paare erfüllen WCAG AA (Skript: `contrast.mjs`, Ergebnis vom 26.09.2026).

## 4. Vergleich mit der aktuellen Handel-Offensiv-Website

| Element | handel-offensiv.de heute (`assets/css/style.css`) | Palette v2 | Bewertung |
|---|---|---|---|
| Dunkle Hauptfläche | `--dark #101C2A`, `--dark-2 #16263A` | `navy #0F2340`, `navySoft #1B3A66` | gleiche Familie, v2 etwas satter/blauer – wirkt weniger „grau" |
| Seitengrund | `--paper #F5F7F9` (kühl) | `paper #F6F4EE` (warm) | bewusst wärmer, damit Gold nicht „schmutzig" wirkt |
| Text | `--ink #131A22`, `--ink-soft #44505E` | `#141B26`, `#4F5866` | praktisch identisch |
| Akzent | Blau `--green #2E6FB0` / `#7FB8E8` / `#1F5E96` | Gold `#AD8027` / `#D9AE45` / `#8A6414` | **Kernänderung laut Freigabe**: Blau-Akzent entfällt |
| Linien | `#DEE4EA` / `#263A50` | `#E2DFD6` / `#24395C` | leicht wärmer |
| Radius, Schrift | 2 px, Archivo | 2 px, Archivo | unverändert |

Die Live-Website bleibt bis zum Cutover (Phase 5) unverändert; die Palette v2 gilt für Admin, Campus und die neue Website.

## 5. Einsatz in den Apps

- **Admin (`apps/admin`)**: Tailwind-Preset aus `@handel-offensiv/config`; `Button` `primary` = Navy, neue Variante `accent` = Gold (nur wichtige CTA); Fokusring Navy; Selektion Gold/Navy. Klassen `green*`/`dark*` funktionieren über Aliasse weiter und werden in Phase 2 umbenannt.
- **Mobile (`apps/mobile`)**: `colors.*` aus `@handel-offensiv/config` – Aliasse aktiv; Umstellung mit Phase 9.
- **E-Mails**: `EMAIL_COLORS` in `email-core.ts` (Navy-Button, Gold-Quadrat als einziger Akzent).
- **Vorschau**: `docs/design/tokens-preview.html` (statisch, Desktop + Mobil) – Screenshots im Zwischenbericht.
