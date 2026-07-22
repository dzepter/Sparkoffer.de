# Sparkoffer Link-Roboter 🤖 + Deal-Portal 💶

Zwei Teile in einem Projekt:

1. **Link-Roboter** (wie bisher): holt automatisch Hotel-Detailseiten und
   Deal-Daten von check24.net.
2. **NEU – Deal-Portal (v14):** eine öffentliche Reisedeal-Website unter `/`,
   die mit **Google AdSense** (Werbung) und **Affiliate-Links** Geld verdient.
   Der Roboter liefert die Daten, du prüfst und veröffentlichst die Deals in
   wenigen Minuten über `/admin`. Die alte interne App liegt jetzt unter `/app`.

## 💶 Geld verdienen mit dem Deal-Portal

### So funktioniert das Geschäftsmodell
- Besucher finden deine Deal-Seiten über Google, Pinterest, WhatsApp-Gruppen etc.
- **Einnahme 1 – AdSense:** Google zeigt Werbung auf deinen Seiten, du wirst pro
  Einblendung/Klick bezahlt (in DE grob 1–10 € pro 1000 Aufrufe, je nach Nische).
- **Einnahme 2 – Affiliate (der größere Hebel):** Jeder „Zum Angebot“-Button trägt
  deinen Partner-Parameter. Bucht jemand die Reise, gibt es Provision – bei
  Pauschalreisen oft deutlich mehr pro Buchung als AdSense pro tausend Besucher.

### Einrichtung (einmalig)
1. **Deployen wie gehabt** (siehe unten). Danach in Render → **Environment** setzen:
   - `ADMIN_TOKEN` – frei gewähltes Passwort für `/admin`
   - `SITE_URL` – z. B. `https://www.sparkoffer.de`
   - `IMPRESSUM_NAME`, `IMPRESSUM_ADRESSE`, `IMPRESSUM_EMAIL` – **Pflicht!**
     Ohne vollständiges Impressum ist die Seite in DE nicht zulässig und
     AdSense lehnt ab.
   - `AFFILIATE_SUFFIX` – dein Partner-Parameter (bekommst du vom
     Check24-Partnerprogramm, z. B. über AWIN), etwa `wpset=DEINE-ID`
2. **Eigene Domain verbinden** (sparkoffer.de → Render „Custom Domain“).
   AdSense akzeptiert keine `*.onrender.com`-Adressen sinnvoll – eigene Domain
   ist Pflicht (~10–15 €/Jahr).
3. **10–20 Deals veröffentlichen** über `/admin` (jeweils mit eigenem Text!).
4. **Bei Google AdSense bewerben** (adsense.google.com) und nach Freischaltung:
   - `ADSENSE_CLIENT` = deine `ca-pub-…`-Nummer als Umgebungsvariable setzen
   - In AdSense eine **Consent-Abfrage (CMP)** für EU-Besucher aktivieren –
     Google verlangt das, sonst keine Anzeigen in Deutschland.
5. **Check24-Partnerprogramm beantragen** (läuft über AWIN) und den
   `AFFILIATE_SUFFIX` eintragen. Frag dort auch nach der offiziellen
   Deep-Link-Erstellung – das ersetzt langfristig das Scraping (sauberster Weg).

### Budgetvorschlag für 2.500 € (einmalig)
| Posten | ca. |
|---|---|
| Domain + Hosting-Upgrade (Render Starter + Persistent Disk, 1 Jahr) | 150 € |
| Logo/Design-Feinschliff (optional, Fiverr o. ä.) | 150 € |
| 20–30 gute Ratgeber-Artikel („Beste Reisezeit Türkei“ …) schreiben lassen – bringt Google-Traffic, den Deal-Seiten allein nicht bekommen | 1.200 € |
| Pinterest/Social-Startaufbau + Canva Pro (1 Jahr) | 300 € |
| Reserve (Rechtstexte prüfen lassen, Tools, Tests) | 700 € |

### Dein 10-Stunden-Wochenplan
- **Mo–Fr je ~1 h:** `/admin` öffnen → Link-Roboter befragen → besten Deal
  prüfen → 3–5 Sätze eigenen Kommentar schreiben → veröffentlichen →
  Deal in 2–3 WhatsApp/Telegram/Facebook-Gruppen und auf Pinterest teilen.
- **~3 h am Wochenende:** alte Deals löschen (abgelaufene Preise!), 1 Ratgeber-
  Artikel einstellen/beauftragen, Zahlen ansehen (AdSense + AWIN-Statistik).
- **~2 h Puffer:** Backup ziehen (`/admin` → Export), Ideen testen.

### Ehrliche Erwartung (wichtig!)
- **Monat 1–3: praktisch 0 €.** AdSense-Freischaltung dauert, Google-Rankings
  brauchen Monate. Das ist normal und kein Fehler der Seite.
- **Monat 4–12:** realistisch sind zunächst zweistellige, später niedrige
  dreistellige Monatsbeträge – der Affiliate-Anteil wächst mit der Reichweite.
  Alles darüber erfordert deutlich mehr Inhalt und Reichweite.
- **Nicht machen:** Google-Ads-Anzeigen schalten, nur um AdSense-Klicks zu
  kassieren („Arbitrage“) – das verstößt gegen die AdSense-Richtlinien und
  führt zur Kontosperrung. Ebenso keine Klicks auf eigene Anzeigen.
- **Eigener Text ist Pflicht:** Das Portal erzwingt min. 150 Zeichen Kommentar
  pro Deal. Vollautomatische Seiten ohne eigenen Inhalt lehnt AdSense als
  „Low value content“ ab.
- **Deals verfallen:** Beim Render-**Gratis**-Tarif ohne Disk gehen die Deals
  bei jedem Neustart verloren. Für den echten Betrieb: Persistent Disk
  hinzubuchen und `DATA_DIR` auf den Disk-Pfad setzen – oder regelmäßig das
  JSON-Backup aus `/admin` sichern.

---

## Teil 1: Der Link-Roboter (wie bisher)

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

## Update einspielen (wenn du schon deployed hast)
GitHub → dein Repository → `server.js` anklicken → Stift-Symbol (Edit) →
kompletten Inhalt durch die neue Datei ersetzen → **Commit changes**.
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
