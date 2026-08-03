# Handel Offensiv – Website von Aigner Offensiv

Neuentwicklung der Website [aigner-offensiv.de](https://www.aigner-offensiv.de)
mit der strategischen Neupositionierung **Handel Offensiv – Der
Führungsführerschein für den Handel**.

Technik: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4.
Alle Seiten werden statisch vorgerendert; nur das Kontaktformular läuft
über eine Server Action.

## Entwicklung

```bash
pnpm install
pnpm dev            # Entwicklung auf http://localhost:3000
pnpm build          # Produktions-Build
pnpm start          # Produktionsserver
pnpm lint           # ESLint
pnpm typecheck      # TypeScript
pnpm test:e2e       # End-to-End-Tests (vorher: pnpm build)
```

Für die E2E-Tests wird Chromium benötigt (`pnpm exec playwright install
chromium` oder `CHROMIUM_EXECUTABLE_PATH` auf einen vorhandenen Chromium
setzen).

## Inhalte pflegen

Alle Inhalte liegen zentral unter `src/content/` – Seiten und Komponenten
lesen ausschließlich von dort:

| Datei | Inhalt |
| --- | --- |
| `site.ts` | Marke, Claims, Kontaktdaten, Navigation, Routen, CTA-System |
| `modules.ts` | Die fünf Offensivtage (einzige Quelle für Übersicht + Detail) |
| `offers.ts` | Angebote für Unternehmen + Wirkungscheck |
| `program.ts` | Programmformat und Präsenz-Argumentation |
| `impulse.ts` | Impulsvorträge |
| `rainer.ts` | Biografie, Führungsverständnis, Buch |
| `testimonials.ts` | Teilnehmerstimmen |
| `faqs.ts` | Häufige Fragen |
| `images.ts` | Bildregister (siehe PHOTO-GUIDE.md) |

Ein neuer Offensivtag, ein neuer Vortrag oder ein neues Testimonial ist
damit ein reiner Dateneintrag – ohne Änderungen an Seiten oder Komponenten.

**Fotos einsetzen:** siehe [PHOTO-GUIDE.md](./PHOTO-GUIDE.md).
**Offene inhaltliche Punkte:** siehe [CONTENT-TODO.md](./CONTENT-TODO.md).

## Kontaktformular konfigurieren

E-Mail-Versand per SMTP, ausschließlich über Umgebungsvariablen
(siehe `.env.example`):

```
SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS,
CONTACT_TO, CONTACT_FROM
```

Ohne `SMTP_HOST` werden Anfragen in der Entwicklung akzeptiert (ohne
Versand); in Produktion erhalten Nutzer eine Fehlermeldung mit direkten
Kontaktwegen, damit keine Anfrage unbemerkt verloren geht.

Schutzmechanismen: serverseitige Validierung, Honeypot-Feld,
Rate-Limiting pro IP (In-Memory; bei mehreren Server-Instanzen durch
zentralen Store ersetzen). Anfrageinhalte werden nicht geloggt.

## Migration von der alten WordPress-Website

- Alle alten URLs werden per 308-Redirect weitergeleitet
  (`next.config.ts`): LEARN-TO-LEAD und alte Führungsseiten →
  `/handel-offensiv`, Vorträge/Blog → `/impulse`, Über-uns →
  `/rainer-aigner`, Potentiale-steuern → `/fuer-unternehmen`.
- Impressum und Datenschutzerklärung wurden von der alten Website
  übernommen; nicht mehr eingesetzte Dienste (Google Analytics, YouTube,
  Borlabs, reCAPTCHA/Turnstile) wurden aus der Datenschutzerklärung
  entfernt, ein Abschnitt zum Kontaktformular ergänzt.
  **Vor Livegang rechtlich prüfen lassen.**
- Die Website setzt keine Cookies, lädt keine externen Schriften und
  bindet keine externen Dienste ein – daher kein Cookie-Banner.

## Deployment

`pnpm build` erzeugt einen statisch vorgerenderten Auftritt plus
Server-Action-Endpunkt; es wird eine Node.js-Laufzeit benötigt
(z. B. eigener Server mit `pnpm start`, oder eine Next.js-kompatible
Plattform). Bei Bedarf kann `output: "standalone"` in `next.config.ts`
ergänzt werden. Der bisherige Strato-Webspace (PHP/WordPress) kann die
Seite nicht direkt ausliefern – Hosting vor Livegang klären
(siehe CONTENT-TODO.md).
