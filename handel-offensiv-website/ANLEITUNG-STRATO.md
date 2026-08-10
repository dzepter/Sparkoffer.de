# handel-offensiv.de bei Strato hochladen – Schritt für Schritt

Diese Anleitung ist für den Upload ohne Vorkenntnisse geschrieben.
Dauer: ca. 15–20 Minuten.

## Schritt 1: Domain prüfen

1. Im Strato-Kundenlogin anmelden: https://www.strato.de/apps/CustomerService
2. Unter **Domains** prüfen, dass `handel-offensiv.de` in Ihrem Paket liegt.
   Falls noch nicht: Domain im Paket bestellen (wenige Klicks, sofort aktiv).

## Schritt 2: Dateien hochladen (einfachster Weg: Strato WebFTP)

1. Im Kundenlogin: Ihr Paket öffnen → **Websitebereich / Dateiverwaltung
   (WebFTP)** aufrufen.
2. Einen neuen Ordner anlegen, z. B. `handel-offensiv`.
3. **Alle Dateien und Ordner aus diesem Verzeichnis** dort hineinladen –
   also `index.html`, `kontakt.html`, `login.html`, `impressum.html`,
   `datenschutz.html`, `account-loeschen.html`, `404.html`,
   `ANLEITUNG-STRATO.md` (optional) sowie die kompletten Ordner
   `assets/` und `cms/`.

   *Tipp:* Bequemer als WebFTP ist das kostenlose Programm
   **FileZilla** – die FTP-Zugangsdaten (Server, Benutzer, Passwort)
   stehen im Strato-Kundenlogin unter „FTP-Zugänge".
   Damit ziehen Sie einfach den ganzen Ordnerinhalt per Maus hinüber.

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
