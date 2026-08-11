# handel-offensiv.de bei Strato hochladen – Schritt für Schritt

Diese Anleitung ist für den Upload ohne Vorkenntnisse geschrieben.
Dauer: ca. 15–20 Minuten.

## Schritt 1: Domain prüfen

1. Im Strato-Kundenlogin anmelden: https://www.strato.de/apps/CustomerService
2. Unter **Domains** prüfen, dass `handel-offensiv.de` in Ihrem Paket liegt.
   Falls noch nicht: Domain im Paket bestellen (wenige Klicks, sofort aktiv).

## Schritt 2: Dateien hochladen

**Weg A – im Browser (Strato-Dateimanager):**

1. Im Kundenlogin: Ihr Paket öffnen → in der linken Menüleiste
   **„Datenbanken und Webspace" → „Webspace verwalten"**.
   (So heißt das frühere „WebFTP" heute.)
2. Oben **„Neues Verzeichnis erstellen"** → Name `handel-offensiv`.
3. In den Ordner wechseln und über **„Datei hochladen"** alle Dateien
   hineinladen: `index.html`, `login.html`, `kontakt.html`,
   `impressum.html`, `datenschutz.html`, `account-loeschen.html`,
   `404.html`, `.htaccess`, `robots.txt`, `sitemap.xml` sowie die
   kompletten Ordner `assets/` und `cms/` (Unterordner ggf. von Hand
   anlegen und die Dateien einzeln hochladen).

**Weg B – bequemer mit FileZilla (empfohlen):**

1. Kostenloses Programm **FileZilla** installieren
   (filezilla-project.org).
2. Zugangsdaten: im Kundenlogin unter **„Datenbanken und Webspace" →
   „SFTP & SSH"** (Server, Benutzername; Passwort dort festlegen).
   In FileZilla eintragen, Port **22**, „Verbinden".
3. Links den entpackten Website-Ordner öffnen, rechts den Ordner
   `handel-offensiv` anlegen und den **kompletten Inhalt** mit der
   Maus hinüberziehen – fertig in einem Rutsch.

   *Hinweis:* Die Datei `.htaccess` ist eine „versteckte Datei".
   Falls Sie sie links nicht sehen: in FileZilla im Menü
   **Server → „Auflistung versteckter Dateien erzwingen"** aktivieren.

## Schritt 3: Domain mit dem Ordner verbinden

1. Im Kundenlogin: **Domains → handel-offensiv.de → Einstellungen
   (Zahnrad) → Umleitung/Verwendungsart**.
2. Als Ziel den Ordner `/handel-offensiv` auswählen („interne Weiterleitung"
   bzw. „Domain zeigt auf Verzeichnis").
3. **SSL aktivieren:** Domains → handel-offensiv.de → SSL verwalten →
   das inklusive Zertifikat einschalten und „immer HTTPS verwenden" wählen.

Nach wenigen Minuten ist https://www.handel-offensiv.de erreichbar.

## Schritt 4: Redaktions-Passwort festlegen (einmalig!)

1. Im Browser öffnen: **https://www.handel-offensiv.de/cms/admin.php**
2. Beim allerersten Aufruf legen Sie Ihr Redaktions-Passwort fest
   (mindestens 10 Zeichen – gut merken oder im Passwortmanager speichern).
3. **Wichtig:** Machen Sie diesen Schritt sofort nach dem Upload,
   damit niemand anderes das erste Passwort setzen kann.

## Ab jetzt: Texte jederzeit selbst ändern

- **https://www.handel-offensiv.de/cms/admin.php** aufrufen
- Mit Ihrem Passwort anmelden
- Texte in den Feldern ändern (Überschriften, Offensivtage, Trainer-Text …)
- Unten auf **„Alles speichern"** klicken – fertig, die Website zeigt die
  neuen Texte sofort. Kein HTML, kein FTP, nichts weiter nötig.

Kleiner Trick für farbige Wörter: Text zwischen
`<span class="accent">` und `</span>` erscheint blau.

## Wenn etwas nicht klappt

| Problem | Lösung |
|---|---|
| admin.php zeigt nur Code statt der Login-Seite | Ihr Paket hat PHP deaktiviert → im Kundenlogin unter „PHP-Version" eine aktuelle Version (8.x) aktivieren |
| „Speichern fehlgeschlagen … Schreibrechte" | Im FTP-Programm: Rechtsklick auf den Ordner `cms/` → Dateiberechtigungen → auf 755 setzen, Datei `content.json` auf 644/664 |
| Passwort vergessen | Per FTP die Datei `cms/passwort.php` löschen → beim nächsten Aufruf von admin.php legen Sie ein neues Passwort fest |
| Seite zeigt alte Texte | Browser-Cache: Strg+F5 (Windows) bzw. Cmd+Shift+R (Mac) |
