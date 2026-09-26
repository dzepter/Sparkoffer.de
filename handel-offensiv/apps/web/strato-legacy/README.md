# Strato-Fassung der Website (Altbestand, bis zur DNS-Umstellung)

Die Website `www.handel-offensiv.de` läuft **derzeit** als statische Site auf einem Webspace (Apache/PHP), verwaltet über die DNS-Zone bei Strato. Die Dateien dafür liegen jetzt in `apps/web/public/` (Quelle für beide Hoster). Hier liegen nur die Teile, die **ausschließlich** auf dem alten Webspace funktionieren:

| Datei | Zweck | Auf Vercel |
|---|---|---|
| `.htaccess` | eigene 404-Seite (Apache) | ersetzt durch `src/app/not-found.tsx` |
| `cms/admin.php` | Mini-Redaktion: schreibt `cms/content.json`, das `assets/js/content.js` zur Laufzeit lädt | **entfällt** – kein PHP auf Vercel. Texte werden bis zur Redaktion im Cockpit (Phase 5) direkt in den HTML-Dateien gepflegt. Vor der DNS-Umstellung: aktuelle `cms/content.json` vom Webspace sichern und die Texte in die HTML-Dateien übernehmen. |
| `ANLEITUNG-STRATO.md` | Upload-Anleitung für den Webspace | nur noch für Notfall-Rollback relevant |

**Achtung:** Seit der Umstellung auf die Ein-Domain-Struktur verweisen die HTML-Dateien auf `/login` (Teilnehmer-Login der Akademie). Auf dem alten Webspace existiert dieser Pfad nicht. Wer die Dateien aus `public/` noch einmal auf den Webspace lädt, muss `/login` dort auf `login.html` zurücksetzen oder die Umstellung auf Vercel abwarten (siehe `docs/DEPLOYMENT.md`).
