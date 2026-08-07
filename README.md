# Sparkoffer Link-Roboter 🤖

Holt automatisch die Hotel-Detailseiten-URL von check24.net für deine Deals.
Deine Sparkoffer-App ruft ihn per Knopfdruck auf – du bekommst den Original-Link
ohne selbst zu suchen.

## Einmalige Einrichtung (ca. 30 Min., alles kostenlos)

### 1. GitHub-Konto anlegen (falls noch nicht vorhanden)
github.com → Sign up

### 2. Neues Repository erstellen
- github.com → „+" oben rechts → **New repository**
- Name: `sparkoffer-link-roboter` → **Create repository**
- **„uploading an existing file"** anklicken → die 3 Dateien
  `server.js`, `package.json`, `Dockerfile` hineinziehen → **Commit changes**

### 3. Bei Render.com deployen
- render.com → mit GitHub anmelden
- **New → Web Service** → dein Repository `sparkoffer-link-roboter` wählen
- Language: **Docker** (wird automatisch erkannt)
- Instance Type: **Free**
- **Create Web Service** → warten bis „Live" (erster Build dauert einige Minuten)
- Oben steht deine Adresse, z. B. `https://sparkoffer-link-roboter.onrender.com`

### 4. In der Sparkoffer-App eintragen
⚙️ Einstellungen → Feld **„Link-Roboter-URL"** → Adresse einfügen. Fertig!

## Testen
Im Browser aufrufen:
```
https://DEINE-ADRESSE.onrender.com/deal-link?hotel=Yalihan+Aspendos&von=2026-07-04&bis=2026-07-11
```
Antwort sollte `"ok": true` und eine `urlaub.check24.net`-URL enthalten.

## NEU in v9: /best-deal (der Tagesdeal)
Vergleicht bis zu 3 Ziele in einem Durchlauf, wählt den stärksten Deal
(Rabatt + Bewertung), öffnet die Angebotsseite und liest Sterne, Bewertung,
Verpflegung, Zimmer, Reisedaten und Extras gleich mit aus:
```
https://DEINE-ADRESSE.onrender.com/best-deal?ziele=Türkei,Ägypten,Mallorca&airport=Frankfurt&minRabatt=40
```
Ab `minRabatt` (Standard 40 %) greift er sofort zu; sonst nimmt er am Ende
den besten gefundenen Deal. Die Antwort enthält ein `protokoll` mit dem, was
er pro Ziel gefunden hat.

## NEU in v14: Payback Punkte-App 💙
Eine kleine Handy-App mit zwei Knöpfen:
1. **Alle Coupons aktivieren** – der Roboter meldet sich bei payback.de an und
   aktiviert jeden Coupon im Coupon-Center (gilt danach überall: Karte,
   Payback-App und online).
2. **Amazon über Payback öffnen** – öffnet die Payback-Partnerseite
   `payback.de/amazon`. Dort auf **„Jetzt shoppen"** tippen, dann bei Amazon
   normal bestellen → 1 °Punkt pro 2 € (Amazon ist seit 2022 Payback-Partner).

### Einrichtung (einmalig, ca. 5 Min.)
1. render.com → dein Web Service → **Environment** → zwei Variablen anlegen:
   - `PAYBACK_NUTZER` = deine Payback-Kartennummer, E-Mail oder Alias
   - `PAYBACK_PIN` = deine PIN bzw. dein Passwort
   - Optional: `PAYBACK_SCHLUESSEL` = ein selbst ausgedachtes Geheimwort.
     Dann kann niemand außer dir den Coupon-Knopf aufrufen (dasselbe Wort
     in der App unter ⚙️ eintragen).
2. **Save Changes** → Render startet neu (ca. 5 Min.).
3. Auf dem Handy öffnen: `https://DEINE-ADRESSE.onrender.com/payback-app`
4. Als App aufs Handy legen: im Browser-Menü **„Zum Startbildschirm
   hinzufügen"** (Android) bzw. Teilen-Symbol → **„Zum Home-Bildschirm"**
   (iPhone). Ab dann startet sie wie eine normale App.

### Wichtig zu den Amazon-Punkten
- Es zählt **nur**, wenn du den Einkauf über die Payback-Seite startest
  (Knopf in der App → „Jetzt shoppen"). Beim ersten Mal dort anmelden.
- Warenkorb vorher leeren, innerhalb von 24 Stunden bestellen.
- Ausgenommen: u. a. Bücher, E-Books, Lebensmittel, Geschenkgutscheine,
  Abos (Prime, Audible …) und Vorbestellungen.
- Punkte erscheinen nach wenigen Tagen erst „gesperrt" und werden nach
  ca. 70 Tagen (Rückgabefrist) freigeschaltet.

### Wichtig zur Sicherheit & fair bleiben
- Deine Zugangsdaten liegen **nur** in Render als Environment-Variablen –
  nicht im Code und nicht auf GitHub. Trag sie nirgendwo anders ein.
- Falls dein Payback-Konto eine 2-Faktor-Bestätigung (SMS-Code) verlangt,
  kann der Roboter sich nicht anmelden – die App zeigt das dann als Fehler.
- Automatisiertes Aktivieren kann gegen die Payback-Nutzungsbedingungen
  verstoßen (gleiches Thema wie bei Check24 unten). Nutzung auf eigenes
  Risiko – im Zweifel Coupons von Hand in der Payback-App aktivieren.
- Wenn ein Fehler kommt (`"ok": false` mit `step` und `error`): Meldung an
  Claude schicken – die Klick-Stellen auf payback.de können sich ändern und
  werden dann in `server.js` nachjustiert.

## Update einspielen (wenn du schon deployed hast)
GitHub → dein Repository → `server.js` anklicken → Stift-Symbol (Edit) →
kompletten Inhalt durch die neue Datei ersetzen → **Commit changes**.
Für v14 zusätzlich: die neue Datei `payback-app.html` hochladen („Add file →
Upload files") und die `Dockerfile` genauso aktualisieren.
Render baut automatisch neu (ca. 5 Min.), fertig.

## Wichtige Hinweise
- **Gratis-Tarif schläft ein:** Nach 15 Min. ohne Nutzung schläft der Dienst;
  der erste Aufruf danach dauert ~1 Min. (die App wartet automatisch).
- **Wenn ein Fehler kommt** (`"ok": false` mit `step` und `error`):
  Schick die Antwort an Claude – die Klick-Stellen auf check24.net können sich
  ändern und werden dann in server.js nachjustiert.
- **Rechtlicher Hinweis:** Automatisiertes Auslesen kann gegen die
  Nutzungsbedingungen von Check24 verstoßen. Kläre das im Zweifel mit deinem
  Ansprechpartner im Check24-Partnerprogramm – und frag dort auch nach einer
  offiziellen Deep-Link-Lösung, das wäre der sauberste Weg.
