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
