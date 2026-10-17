# WordPress `aigner-offensiv.de`: Vollbackup und sofortige Sicherheitsmaßnahmen

**Stand: 26.09.2026 (Phase 1, Freigabe Punkt 10).** Verbindlich: vor jeder Änderung vollständiges Backup (Datenbank + Dateien), Theme-/Plugin-Kompatibilität prüfen, **PHP nicht blind produktiv umstellen**, Upgrade zuerst auf Test-/Staging prüfen. Sofort mögliche Sicherheitsmaßnahmen ohne riskante Migration dürfen vorher umgesetzt werden.

## 1. Bestand (aus dem Archiv `docs/archive/aigner-offensiv-wordpress-2026-09/`)

| Punkt | Befund | Risiko |
|---|---|---|
| WordPress | 6.7.9 (Sicherheitszweig 6.7, wird noch gepflegt) | mittel – Major-Update auf 6.8/6.9 wegen PHP-Version nicht möglich |
| PHP | 7.4.33 | **hoch** – PHP 7.4 erhält seit 11/2022 keine Sicherheitsupdates; WordPress 6.8+ verlangt PHP 7.2+, empfiehlt 8.1+ |
| Theme/Plugins | siehe Archiv-Index (`index.md`) | unbekannte Kompatibilität mit PHP 8.x – **deshalb Staging-Test vor Umstellung** |
| REST-API | öffentlich (Seiten, Beiträge, Medien lesbar) | niedrig, aber Benutzer-Enumeration über `/wp-json/wp/v2/users` prüfen |
| Autorenname | im HTML sichtbar | niedrig |

## 2. Vollbackup (vor jeder Änderung; Aufwand ca. 30 Minuten)

Der Zugang zum WordPress-Backend und zum Hosting (Strato-Kundenlogin für `aigner-offensiv.de`) liegt beim Auftraggeber. Vorgehen:

### 2.1 Datenbank

1. Strato-Kundenlogin → *Datenbanken und Webspace → Datenbankverwaltung* → phpMyAdmin öffnen.
2. Datenbank der WordPress-Installation wählen (Name steht in `wp-config.php`, Zeile `DB_NAME`).
3. *Exportieren* → Methode **Angepasst**, Format **SQL**, alle Tabellen, Option „DROP TABLE hinzufügen“ **aus**, „CREATE TABLE“ **an**, Kompression **gzip**.
4. Datei `aigner-offensiv_db_JJJJ-MM-TT.sql.gz` speichern; Größe > 0 prüfen; Datei **außerhalb des Webspace** ablegen (lokal + verschlüsselte Cloud).

### 2.2 Dateien

1. Per WebFTP oder FTP-Programm (FileZilla, SFTP) das gesamte WordPress-Verzeichnis herunterladen: `wp-content/` (Themes, Plugins, Uploads), `wp-config.php`, `.htaccess`, alle Kern-Dateien.
2. Prüfen: Anzahl Dateien/Größe mit dem Server vergleichen; Stichprobe `wp-content/uploads/2020/…` öffnen.
3. Als ZIP mit Datum ablegen; Backup-Datum in dieser Datei notieren.

**Bereits gesichert (Phase 1, ohne Backend-Zugang):** alle öffentlich erreichbaren Inhalte (Seiten, Beiträge, Medien-Metadaten, gerenderte HTML-Stände) im Repo-Archiv sowie ein ZIP mit allen Medien- und Theme-Bilddateien (`wordpress-dateien-backup-2026-09-26.zip`, 35 MB, 85 Dateien – wird separat übergeben). Das ersetzt **nicht** das Datenbank-Backup.

### 2.3 Wiederherstellungstest (Pflicht, einmalig)

Datenbank-Export in eine leere lokale Datenbank importieren (z. B. Local by Flywheel / DDEV), Dateien einspielen, `wp-config.php` anpassen, Website lokal aufrufen. Erst ein erfolgreicher Testlauf macht das Backup belastbar.

## 3. Sofortmaßnahmen ohne Migrationsrisiko (nach dem Backup)

| Maßnahme | Wo | Risiko | Wirkung |
|---|---|---|---|
| Alle Administrator-Passwörter erneuern (mind. 16 Zeichen), unbenutzte Benutzer löschen | WP-Backend → Benutzer | keins | verhindert Übernahme mit alten Zugangsdaten |
| Zwei-Faktor-Anmeldung für Admins (Plugin „Two-Factor“, offiziell vom WordPress-Team) | Plugins | gering | Schutz gegen Passwort-Diebstahl |
| Automatische Updates für **Sicherheits-Minor-Releases** eingeschaltet lassen (Standard) | `wp-config.php`: keine `WP_AUTO_UPDATE_CORE=false`-Zeile | keins | 6.7.x-Sicherheitsfixes kommen automatisch |
| Inaktive Plugins/Themes **löschen** (nicht nur deaktivieren) | Plugins/Design | gering – vorher Backup | weniger Angriffsfläche |
| Datei-Editor abschalten: `define('DISALLOW_FILE_EDIT', true);` | `wp-config.php` | keins | kein Code-Editieren aus dem Backend |
| XML-RPC deaktivieren (Plugin „Disable XML-RPC“ oder `.htaccess`-Regel) | `.htaccess` | gering – nur wenn keine App/Jetpack XML-RPC nutzt | Brute-Force-Vektor weg |
| Login-Begrenzung („Limit Login Attempts Reloaded“) | Plugins | gering | Brute-Force bremsen |
| Benutzer-Enumeration prüfen: `https://www.aigner-offensiv.de/wp-json/wp/v2/users` – falls Benutzerliste sichtbar: REST-Users-Endpoint für Gäste abschalten (Security-Plugin oder Snippet) | Plugin/Snippet | gering | Benutzernamen nicht mehr öffentlich |
| `wp-config.php` und `.htaccess` gegen Schreibzugriff schützen (Dateirechte 440/444) | FTP | gering | Manipulation erschwert |
| Backup-Plugin für **regelmäßige** Sicherungen (UpdraftPlus, Ziel: externer Speicher) | Plugins | gering | wöchentliche Sicherung ohne Handarbeit |

**Nicht** jetzt: Major-Update WordPress, PHP-Umstellung, Theme-/Plugin-Major-Updates.

## 4. PHP-Umstellung – nur über Staging

1. Bei Strato eine **Kopie** der Installation als Subdomain/Unterordner anlegen (Dateien + DB-Import mit angepasster `siteurl`/`home`), `robots.txt` auf `Disallow: /` und `noindex` setzen.
2. Dort PHP-Version im Strato-Menü *PHP-Version* auf **8.2** stellen; `WP_DEBUG_LOG` aktivieren.
3. Prüfen: Startseite, alle Seiten aus dem Archiv-Index, Kontaktformular, Backend (Beitrag speichern, Medien hochladen), Theme-Einstellungen; `debug.log` auf Deprecated-/Fatal-Meldungen.
4. Inkompatible Plugins aktualisieren oder ersetzen; erneut testen.
5. Erst danach dieselbe Version produktiv stellen – mit frischem Backup und Rollback-Plan (PHP-Version zurückstellen dauert bei Strato Sekunden).
6. Anschließend WordPress-Major-Update (6.9), wieder zuerst auf Staging.

## 5. Einordnung im Gesamtplan

Die Website zieht in Phase 5 nach Next.js um (`IMPLEMENTATION_PLAN.md`, Abschnitt 4). Die WordPress-Härtung ist eine **Überbrückung** für die Zeit bis zum Cutover; danach wird WordPress stillgelegt (Backup bleibt archiviert, 301-Redirects laut Redirect-Karte).
