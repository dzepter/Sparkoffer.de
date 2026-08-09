# Archivo-Webfonts (lokal, DSGVO-konform)

Die Archivo-Schriftdateien werden bewusst LOKAL gebündelt – kein Google-Fonts-CDN
(DSGVO, Briefing §38). Bitte die woff2-Dateien aus dem Website-Projekt kopieren:

Quelle: `aigner-offensiv/assets/fonts/`

Erwartete Dateien in diesem Verzeichnis:

- `Archivo-Regular.woff2` (400)
- `Archivo-Medium.woff2` (500)
- `Archivo-Bold.woff2` (700)
- `Archivo-ExtraBold.woff2` (800)

Die `@font-face`-Deklarationen in `src/app/globals.css` sind defensiv:
Fehlen die Dateien, greift automatisch der System-Font-Stack – die App bleibt
voll funktionsfähig, nur die Typografie weicht ab.
