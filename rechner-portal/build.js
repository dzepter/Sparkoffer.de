/* Rechner-Portal – statischer Site-Generator
   Erzeugt aus den Rechner-Definitionen in calculators/ eine komplette,
   schnelle Website in dist/ (Startseite, Rechner-Seiten, Impressum,
   Datenschutz, sitemap.xml, robots.txt, ads.txt).

   Bauen:   node build.js
   Neuer Rechner: Datei in calculators/ anlegen (Vorlage: jede bestehende
   Datei) und neu bauen – fertig. Konfiguration in site.config.json.
*/

const fs = require('fs');
const path = require('path');
const CFG = require('./site.config.json');

const DIST = path.join(__dirname, 'dist');
const SITE = (CFG.siteUrl || '').replace(/\/+$/, '');
const HEUTE = new Date().toISOString().slice(0, 10);

const KATEGORIEN = {
  finanzen:   { name: 'Finanzen & Beruf',    icon: '💶', text: 'Gehalt, Steuern, Kredite und Sparen – schnell durchgerechnet.' },
  gesundheit: { name: 'Gesundheit & Körper', icon: '❤️', text: 'Von BMI bis Schlafrhythmus – Orientierungswerte für deinen Alltag.' },
  alltag:     { name: 'Alltag & Zeit',       icon: '🕒', text: 'Datum, Fahrtkosten, Strom und mehr – die kleinen Fragen des Alltags.' }
};

/* ---------------- Rechner laden ---------------- */
const rechner = fs.readdirSync(path.join(__dirname, 'calculators'))
  .filter(f => f.endsWith('.js'))
  .map(f => require('./calculators/' + f))
  .sort((a, b) => a.title.localeCompare(b.title, 'de'));

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ---------------- AdSense ---------------- */
function adKopf(){
  if (!CFG.adsenseClient) return '';
  return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(CFG.adsenseClient)}" crossorigin="anonymous"></script>`;
}
function adBlock(){
  if (!CFG.adsenseClient) return '';
  const slot = CFG.adsenseSlot ? ` data-ad-slot="${esc(CFG.adsenseSlot)}"` : '';
  return `<div class="adwrap"><span class="adlabel">Anzeige</span>
<ins class="adsbygoogle" style="display:block" data-ad-client="${esc(CFG.adsenseClient)}"${slot} data-ad-format="auto" data-full-width-responsive="true"></ins>
<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>`;
}

/* ---------------- Design ---------------- */
const CSS = `
:root{--blau:#1554a3;--blau2:#0d3f80;--tinte:#182234;--grau:#5c6675;--rand:#dfe4ec;--bg:#f4f6f9;--gruen:#0c7a43;--rot:#c22040}
*{box-sizing:border-box;margin:0}
body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--tinte);line-height:1.6;font-size:16px}
a{color:var(--blau)}
header{background:var(--blau);color:#fff;padding:12px 16px}
.in{max-width:880px;margin:0 auto}
header a.logo{color:#fff;text-decoration:none;font-weight:800;font-size:1.3rem}
header .claim{font-size:.82rem;opacity:.85}
nav{margin-top:6px;font-size:.9rem}
nav a{color:#fff;opacity:.9;text-decoration:none;margin-right:14px}
nav a:hover{opacity:1;text-decoration:underline}
main{max-width:880px;margin:0 auto;padding:20px 16px 48px}
h1{font-size:1.55rem;line-height:1.25;margin:10px 0 10px}
h2{font-size:1.2rem;margin:26px 0 10px}
h3{font-size:1.02rem;margin:16px 0 6px}
p{margin:0 0 12px}
ul,ol{margin:0 0 12px;padding-left:22px}
.brot{font-size:.82rem;color:var(--grau);margin-top:4px}
.brot a{color:var(--grau)}
.rechner{background:#fff;border:1px solid var(--rand);border-radius:14px;padding:20px;margin:16px 0;box-shadow:0 1px 3px rgba(20,40,80,.06)}
.feld{margin-bottom:12px}
.feld label{display:block;font-size:.85rem;font-weight:600;margin-bottom:4px}
.feld input,.feld select{width:100%;padding:10px;border:1px solid #c6cedb;border-radius:9px;font:inherit;background:#fff}
.feld input:focus,.feld select:focus{outline:2px solid var(--blau);border-color:var(--blau)}
.zeile{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:540px){.zeile{grid-template-columns:1fr}}
.ergebnis{background:#eef4fc;border:1px solid #c9dcf5;border-radius:10px;padding:14px 16px;margin-top:14px;font-size:.98rem}
.ergebnis .gross{font-size:1.5rem;font-weight:800;color:var(--blau2)}
.ergebnis table{border-collapse:collapse;width:100%;margin-top:6px}
.ergebnis td{padding:3px 10px 3px 0;vertical-align:top}
.ergebnis td:last-child{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.ergebnis .summe td{border-top:1px solid #c9dcf5;font-weight:700;padding-top:6px}
.hint{font-size:.8rem;color:var(--grau);margin-top:8px}
.kacheln{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin:14px 0}
.kachel{background:#fff;border:1px solid var(--rand);border-radius:12px;padding:14px;text-decoration:none;color:var(--tinte);display:block}
.kachel:hover{border-color:var(--blau);box-shadow:0 2px 8px rgba(20,60,120,.10)}
.kachel b{color:var(--blau);display:block;margin-bottom:4px}
.kachel span{font-size:.85rem;color:var(--grau)}
.suche{width:100%;padding:12px;border:1px solid #c6cedb;border-radius:10px;font:inherit;margin:8px 0 4px}
.adwrap{margin:26px 0;text-align:center}
.adlabel{display:block;color:var(--grau);font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}
details{background:#fff;border:1px solid var(--rand);border-radius:10px;margin-bottom:8px;padding:12px 16px}
details summary{cursor:pointer;font-weight:600}
details p{margin:10px 0 0}
.disclaimer{font-size:.8rem;color:var(--grau);border-top:1px solid var(--rand);margin-top:26px;padding-top:12px}
footer{border-top:1px solid var(--rand);background:#fff;padding:20px 16px;color:var(--grau);font-size:.85rem}
footer a{color:var(--grau)}
.box{background:#fff;border:1px solid var(--rand);border-radius:12px;padding:18px;margin:14px 0}
`;

/* Gemeinsames Browser-JS: deutsche Zahlformate + Auto-Neuberechnung */
const APP_JS = `
function $(id){return document.getElementById(id)}
function n(id){var v=parseFloat(String($(id).value).replace(',','.'));return isNaN(v)?NaN:v}
function fmt(x,d){if(d===undefined)d=2;return x.toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d})}
function eur(x){return fmt(x,2)+' €'}
function zeigen(html){$('ergebnis').innerHTML=html}
function warten(){zeigen('<span class="hint">Fülle die Felder aus – das Ergebnis erscheint automatisch.</span>')}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.rechner input,.rechner select').forEach(function(el){
    el.addEventListener('input',function(){try{berechnen()}catch(e){}});
    el.addEventListener('change',function(){try{berechnen()}catch(e){}});
  });
  try{berechnen()}catch(e){}
});
`;

/* ---------------- Layout ---------------- */
function seite({ titel, beschreibung, pfad, inhalt, jsonld, extraJs }){
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titel)}</title>
<meta name="description" content="${esc(beschreibung || '')}">
${SITE && !/example\.de/.test(SITE) ? `<link rel="canonical" href="${esc(SITE + pfad)}">` : ''}
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧮</text></svg>">
${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ''}
${adKopf()}
<style>${CSS}</style>
</head>
<body>
<header><div class="in">
<a class="logo" href="/">🧮 ${esc(CFG.siteName)}</a>
<div class="claim">${esc(CFG.claim)}</div>
<nav><a href="/#finanzen">Finanzen &amp; Beruf</a><a href="/#gesundheit">Gesundheit</a><a href="/#alltag">Alltag &amp; Zeit</a></nav>
</div></header>
<main>${inhalt}</main>
<footer><div class="in">
<a href="/impressum/">Impressum</a> · <a href="/datenschutz/">Datenschutz</a><br>
Alle Rechner liefern unverbindliche Näherungswerte und ersetzen keine individuelle Steuer-, Rechts-, Finanz- oder medizinische Beratung.
</div></footer>
${extraJs ? `<script>${APP_JS}\n${extraJs}</script>` : ''}
</body>
</html>`;
}

function schreiben(pfad, html){
  const dir = path.join(DIST, pfad);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

/* ---------------- Rechner-Seiten ---------------- */
function rechnerSeite(r){
  const verwandte = rechner.filter(x => x.category === r.category && x.slug !== r.slug).slice(0, 4);
  const kat = KATEGORIEN[r.category];
  const faqHtml = (r.faq || []).map(f =>
    `<details><summary>${esc(f.q)}</summary><p>${f.a}</p></details>`).join('\n');
  const jsonld = (r.faq || []).length ? JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: r.faq.map(f => ({ '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') } }))
  }) : '';

  const inhalt = `
<div class="brot"><a href="/">Start</a> › <a href="/#${r.category}">${esc(kat.name)}</a> › ${esc(r.title)}</div>
<h1>${esc(r.h1 || r.title)}</h1>
${r.intro}
<div class="rechner">
${r.form}
<div id="ergebnis" class="ergebnis"><span class="hint">Fülle die Felder aus – das Ergebnis erscheint automatisch.</span></div>
</div>
${adBlock()}
${r.content}
${faqHtml ? `<h2>Häufige Fragen</h2>\n${faqHtml}` : ''}
${adBlock()}
${verwandte.length ? `<h2>Weitere Rechner aus ${esc(kat.name)}</h2>
<div class="kacheln">${verwandte.map(v => `<a class="kachel" href="/${v.slug}/"><b>${esc(v.title)}</b><span>${esc(v.teaser)}</span></a>`).join('')}</div>` : ''}
${r.disclaimer ? `<div class="disclaimer">${r.disclaimer}</div>` : ''}`;

  return seite({ titel: r.metaTitle, beschreibung: r.metaDesc, pfad: `/${r.slug}/`,
    inhalt, jsonld, extraJs: r.script });
}

/* ---------------- Startseite ---------------- */
function startseite(){
  const sektionen = Object.entries(KATEGORIEN).map(([key, kat]) => {
    const liste = rechner.filter(r => r.category === key);
    return `<h2 id="${key}">${kat.icon} ${esc(kat.name)}</h2>
<p>${esc(kat.text)}</p>
<div class="kacheln">${liste.map(r =>
  `<a class="kachel" data-name="${esc((r.title + ' ' + r.teaser).toLowerCase())}" href="/${r.slug}/"><b>${esc(r.title)}</b><span>${esc(r.teaser)}</span></a>`).join('')}</div>`;
  }).join('\n' + adBlock() + '\n');

  const inhalt = `
<h1>Kostenlose Online-Rechner – schnell, werbefinanziert, ohne Anmeldung</h1>
<p>${esc(CFG.siteName)} beantwortet die Rechenfragen des Alltags: Was bleibt vom Gehalt?
Was kostet der Kredit wirklich? Wie viele Tage bis zum Urlaub? Alle ${rechner.length} Rechner
laufen direkt im Browser – kostenlos, ohne Anmeldung und ohne Installation.</p>
<input class="suche" id="suche" type="search" placeholder="Rechner suchen … (z. B. Netto, BMI, Prozent)">
${sektionen}`;

  const suchJs = `
document.getElementById('suche').addEventListener('input',function(){
  var q=this.value.toLowerCase().trim();
  document.querySelectorAll('.kachel').forEach(function(k){
    k.style.display=(!q||k.dataset.name.indexOf(q)>-1)?'':'none';
  });
});
function berechnen(){}`;

  return seite({ titel: `${CFG.siteName} – ${CFG.claim}`,
    beschreibung: `Über ${rechner.length} kostenlose Online-Rechner: Brutto-Netto, Prozent, Kredit, BMI, Kalorien, Benzinkosten u. v. m. Ohne Anmeldung direkt im Browser.`,
    pfad: '/', inhalt, extraJs: suchJs });
}

/* ---------------- Rechtsseiten ---------------- */
function impressumSeite(){
  const i = CFG.impressum || {};
  const fehlt = !(i.name && i.adresse && i.email);
  return seite({ titel: `Impressum – ${CFG.siteName}`, pfad: '/impressum/', inhalt: `
<h1>Impressum</h1>
${fehlt ? `<div class="box" style="border-color:var(--rot)"><b>⚠️ Noch unvollständig:</b>
Trage Name, Adresse und E-Mail in <code>site.config.json</code> ein und baue die Seite neu.
Ohne vollständiges Impressum darf die Seite in Deutschland nicht öffentlich betrieben werden
– und Google AdSense lehnt die Bewerbung ab.</div>` : ''}
<div class="box"><p>Angaben gemäß § 5 DDG:</p>
<p>${esc(i.name || '[Vor- und Nachname]')}<br>${esc(i.adresse || '[Straße Hausnr., PLZ Ort]').replace(/, /g, '<br>')}<br>
E-Mail: ${esc(i.email || '[E-Mail-Adresse]')}</p>
<p>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: ${esc(i.name || '[Vor- und Nachname]')}</p></div>` });
}

function datenschutzSeite(){
  const i = CFG.impressum || {};
  return seite({ titel: `Datenschutzerklärung – ${CFG.siteName}`, pfad: '/datenschutz/', inhalt: `
<h1>Datenschutzerklärung</h1>
<div class="box">
<h2>Verantwortlicher</h2>
<p>${esc(i.name || '[Name]')}, ${esc(i.adresse || '[Adresse]')}, ${esc(i.email || '[E-Mail]')}</p>
<h2>Grundsatz: Rechnen im Browser</h2>
<p>Alle Rechner arbeiten vollständig in deinem Browser. Eingegebene Werte (z. B. Gehalt,
Gewicht, Datumsangaben) werden <b>nicht</b> an unseren Server übertragen oder gespeichert.</p>
<h2>Hosting</h2>
<p>Beim Aufruf der Website verarbeitet unser Hosting-Anbieter technisch notwendige Daten
(IP-Adresse, Zeitpunkt, aufgerufene Seite) in Server-Logs (Art. 6 Abs. 1 lit. f DSGVO –
Betrieb und Sicherheit der Website).</p>
<h2>Google AdSense</h2>
<p>Wir finanzieren die Seite über Werbung von Google AdSense (Google Ireland Ltd., Dublin).
Google verwendet Cookies bzw. vergleichbare Technologien, um Anzeigen auszuspielen und deren
Reichweite zu messen; dabei können personenbezogene Daten (z. B. IP-Adresse) auch in die USA
übertragen werden. Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die
du über die Einwilligungsabfrage erteilst und jederzeit dort widerrufen kannst. Details:
<a href="https://policies.google.com/technologies/ads?hl=de" rel="noopener">policies.google.com/technologies/ads</a></p>
<h2>Deine Rechte</h2>
<p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das Recht auf Beschwerde bei
einer Datenschutz-Aufsichtsbehörde.</p>
<p class="hint">Hinweis: Diese Vorlage ersetzt keine Rechtsberatung. Vor dem AdSense-Start
in AdSense die EU-Einwilligungsabfrage (zertifizierte CMP) aktivieren – Google verlangt das
für Besucher aus der EU.</p>
</div>` });
}

/* ---------------- Bauen ---------------- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

schreiben('', startseite());
for (const r of rechner) schreiben(r.slug, rechnerSeite(r));
schreiben('impressum', impressumSeite());
schreiben('datenschutz', datenschutzSeite());

/* 404 für statische Hoster */
fs.writeFileSync(path.join(DIST, '404.html'), seite({ titel: `Seite nicht gefunden – ${CFG.siteName}`,
  pfad: '/404', inhalt: '<h1>Diese Seite gibt es nicht</h1><p><a href="/">Zur Übersicht aller Rechner</a></p>' }));

/* robots.txt + sitemap.xml + ads.txt */
fs.writeFileSync(path.join(DIST, 'robots.txt'),
  'User-agent: *\nAllow: /\n' + (SITE ? `Sitemap: ${SITE}/sitemap.xml\n` : ''));

const urls = ['/', ...rechner.map(r => `/${r.slug}/`), '/impressum/', '/datenschutz/'];
fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.map(u => `  <url><loc>${esc(SITE + u)}</loc><lastmod>${HEUTE}</lastmod></url>`).join('\n')
  + '\n</urlset>\n');

if (CFG.adsenseClient) {
  fs.writeFileSync(path.join(DIST, 'ads.txt'),
    `google.com, ${CFG.adsenseClient.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);
}

console.log(`✅ ${rechner.length} Rechner + ${urls.length - rechner.length} Seiten nach dist/ gebaut.`);
