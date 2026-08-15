# SUP Camp Kahler See – Website (Redesign 2026)

Komplett statische Website für **sup-camp-kahl.de** – kein CMS, kein Build-Schritt,
keine externen Abhängigkeiten. Einfach den kompletten Inhalt dieses Ordners in das
Webroot des Hosts hochladen (z. B. per FTP in `public_html/` bzw. `htdocs/`).

## Struktur

```
index.html                          Startseite
boards-preise/                      Verleih, Preise, Kurse, FAQ
galerie/                            Galerie mit Lightbox
kontakt-anfahrt/                    Kontakt, Öffnungszeiten, Anfahrt
aktuelles/                          News-Übersicht
aktuelle-sup-kurse-.../             News-Artikel (Kurstermine)
saisonstart-2026-.../               News-Artikel
mehr-boards-.../                    News-Artikel
impressum/  datenschutzerklaerung/  agbs/  cookie-richtlinie-eu/
assets/css/style.css                Designsystem + alle Styles
assets/js/main.js                   Navigation, Termine-Filter, FAQ, Lightbox, Formular
assets/fonts/                       Big Shoulders Display + Karla (lokal, variable Fonts)
assets/img/                         Alle Fotos als responsive WebP-Ableitungen + Logo
assets/files/SupCampAnmeldebogen.pdf
tools/generate-images.py            Erzeugt die WebP-Ableitungen aus den Original-Fotos
```

Die URLs entsprechen exakt den bisherigen WordPress-Permalinks
(`/boards-preise/`, `/galerie/`, `/kontakt-anfahrt/`, `/aktuelles/`, Artikel-Slugs,
Rechtsseiten) – bestehende Links und SEO bleiben erhalten.

## Kurstermine pflegen

Termine stehen als einfache Listeneinträge mit ISO-Datum im Markup:

```html
<li data-date="2026-08-22"><time datetime="2026-08-22T10:30">Sa, 22.08.</time> …</li>
```

`assets/js/main.js` blendet vergangene Termine automatisch aus; sind alle vorbei,
erscheint ein Hinweistext. Neue Termine einfach als weitere `<li>` ergänzen – an
diesen Stellen:

- `index.html` (Startseite, Sektion „Kurse“)
- `boards-preise/index.html` (Sektion „Nächste Termine“)
- `aktuelle-sup-kurse-am-kahler-see-jetzt-plaetze-sichern/index.html`

## Bilder

Alle Fotos stammen aus der bisherigen WordPress-Mediathek und liegen als
WebP in mehreren Breiten vor (`-w480`, `-w900`, `-w1400`, große Flächen zusätzlich
`-w800/-w1200/-w1800/-w2400`). Neue Bilder mit `tools/generate-images.py`
erzeugen (benötigt Python + Pillow).

## Datenschutz

Die Seite lädt **keine** externen Ressourcen (Fonts lokal, keine Karten-Embeds,
kein Analytics, keine Cookies). Ein Cookie-Banner ist deshalb nicht nötig.
Google Maps wird nur als externer Link geöffnet. Das Kontaktformular öffnet eine
vorbereitete E-Mail im Mailprogramm – es werden keine Daten an einen Server
übertragen. Wird später wieder ein serverseitiges Formular oder Analytics
eingebunden, muss die Consent-Lösung erneut geprüft werden.
