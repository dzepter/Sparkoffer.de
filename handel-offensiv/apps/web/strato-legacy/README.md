# Strato-Fassung der Website (Altbestand, bis zur DNS-Umstellung)

Die Website `www.handel-offensiv.de` läuft **derzeit** als statische Site auf dem Strato-Webspace (Paket Strato Hosting Basic, Auftrag 10061391, Ordner `/handel-offensiv`, Apache/PHP), Domain per „Umleitung Intern“ darauf gelenkt. Die Dateien dafür liegen jetzt in `apps/web/public/` (Quelle für beide Hoster). Hier liegen nur die Teile, die **ausschließlich** auf dem alten Webspace funktionieren:

| Datei | Zweck | Auf Vercel |
|---|---|---|
| `.htaccess` | eigene 404-Seite (Apache) | ersetzt durch `src/app/[...rest]/route.ts` (liefert `public/404.html` mit Status 404) |
| `cms/admin.php` | Mini-Redaktion: schreibt `cms/content.json`, das `assets/js/content.js` zur Laufzeit lädt | **entfällt** – kein PHP auf Vercel. Texte werden bis zur Redaktion im Cockpit (Phase 5) direkt in den HTML-Dateien gepflegt. Sicherung vom 17.10.2026: `content.json.backup-2026-10-17.json` (23 Felder, alle identisch mit den HTML-Texten – nichts zu übernehmen). |
| `ANLEITUNG-STRATO.md` | Upload-Anleitung für den Webspace | nur noch für Notfall-Rollback relevant |

**Achtung:** Seit der Umstellung auf die Ein-Domain-Struktur verweisen die HTML-Dateien auf `/login` (Teilnehmer-Login der Akademie). Auf dem alten Webspace existiert dieser Pfad nicht. Wer die Dateien aus `public/` noch einmal auf den Webspace lädt, muss `/login` dort auf `login.html` zurücksetzen oder die Umstellung auf Vercel abwarten (siehe `docs/DEPLOYMENT.md`).
