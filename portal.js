/* Sparkoffer Deal-Portal (v1)
   Macht aus dem Link-Roboter eine öffentliche Reisedeal-Website, die über
   Google-AdSense-Werbung und Affiliate-Links Geld verdient.

   Einnahmequellen:
   1. Google AdSense   – Werbeblöcke auf allen Seiten (ADSENSE_CLIENT setzen)
   2. Affiliate-Links  – an jeden Deal-Link wird dein Partner-Parameter angehängt

   Konfiguration über Umgebungsvariablen (bei Render: Environment):
   ADSENSE_CLIENT    z. B. ca-pub-1234567890123456  (leer = keine Anzeigen)
   ADSENSE_SLOT      Anzeigenblock-ID aus AdSense    (leer = Auto-Anzeigen)
   ADMIN_TOKEN       frei wählbares Passwort für /admin (leer = Admin gesperrt)
   SITE_URL          z. B. https://www.sparkoffer.de (für sitemap.xml + SEO)
   AFFILIATE_SUFFIX  z. B. wpset=DEINE-ID – wird an jeden Deal-Link angehängt
   IMPRESSUM_NAME / IMPRESSUM_ADRESSE / IMPRESSUM_EMAIL  (Pflicht in DE!)

   Seiten:  /  /deals/<slug>  /impressum  /datenschutz  /sitemap.xml  /robots.txt
   Admin:   /admin  (Deals anlegen, Roboter-Daten übernehmen, löschen, Export)
   API:     GET /api/deals   POST /api/deals   DELETE /api/deals/<slug>
*/

const fs = require('fs');
const path = require('path');

const CFG = {
  adsenseClient: process.env.ADSENSE_CLIENT || '',
  adsenseSlot:   process.env.ADSENSE_SLOT || '',
  adminToken:    process.env.ADMIN_TOKEN || '',
  siteUrl:       (process.env.SITE_URL || '').replace(/\/+$/, ''),
  affiliateSuffix: process.env.AFFILIATE_SUFFIX || '',
  impressum: {
    name:    process.env.IMPRESSUM_NAME || '',
    adresse: process.env.IMPRESSUM_ADRESSE || '',
    email:   process.env.IMPRESSUM_EMAIL || ''
  }
};

const DATA_DIR  = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'deals.json');

function dealsLaden(){
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch(_) { return []; }
}
function dealsSpeichern(deals){
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(deals, null, 2));
}

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function slugify(s){
  return String(s||'').toLowerCase()
    .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60) || 'deal';
}
function affiliateUrl(url){
  if (!url || !CFG.affiliateSuffix) return url || '';
  return url + (url.includes('?') ? '&' : '?') + CFG.affiliateSuffix;
}
function datumDe(iso){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}.${m[2]}.${m[1]}` : (iso || '');
}

/* ---------------- AdSense-Blöcke ---------------- */
function adKopf(){
  if (!CFG.adsenseClient) return '';
  return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(CFG.adsenseClient)}" crossorigin="anonymous"></script>`;
}
function adBlock(){
  if (!CFG.adsenseClient) return '';
  const slot = CFG.adsenseSlot ? `data-ad-slot="${esc(CFG.adsenseSlot)}"` : '';
  return `<div class="adwrap"><span class="adlabel">Anzeige</span>
    <ins class="adsbygoogle" style="display:block" data-ad-client="${esc(CFG.adsenseClient)}"
      ${slot} data-ad-format="auto" data-full-width-responsive="true"></ins>
    <script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>`;
}

/* ---------------- Layout ---------------- */
function seite({ titel, beschreibung, kanonisch, inhalt }){
  return `<!DOCTYPE html><html lang="de"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titel)}</title>
<meta name="description" content="${esc(beschreibung || '')}">
${kanonisch && CFG.siteUrl ? `<link rel="canonical" href="${esc(CFG.siteUrl + kanonisch)}">` : ''}
${adKopf()}
<style>
  :root{--blau:#0a5ec2;--rot:#e11d48;--grau:#5b6472;--rand:#e3e7ee;--bg:#f5f7fa}
  *{box-sizing:border-box;margin:0}
  body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:#1c232e;line-height:1.55}
  header{background:var(--blau);color:#fff;padding:14px 16px}
  header .in,main,footer .in{max-width:960px;margin:0 auto}
  header a{color:#fff;text-decoration:none;font-weight:700;font-size:1.25rem}
  header .claim{font-size:.85rem;opacity:.85}
  main{padding:20px 16px 40px}
  h1{font-size:1.5rem;margin:14px 0 6px}
  h2{font-size:1.15rem;margin:18px 0 8px}
  .karten{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px;margin-top:16px}
  .karte{background:#fff;border:1px solid var(--rand);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:6px}
  .karte a.titel{color:var(--blau);font-weight:700;font-size:1.05rem;text-decoration:none}
  .rabatt{display:inline-block;background:var(--rot);color:#fff;border-radius:6px;padding:2px 8px;font-weight:700;font-size:.85rem}
  .preis{font-size:1.3rem;font-weight:800}
  .preis small{font-weight:400;color:var(--grau);font-size:.8rem}
  .statt{color:var(--grau);text-decoration:line-through;font-size:.9rem}
  .meta{color:var(--grau);font-size:.85rem}
  .extras span{display:inline-block;background:#eef3fa;border-radius:6px;padding:2px 8px;font-size:.8rem;margin:2px 4px 0 0}
  .cta{display:inline-block;background:var(--blau);color:#fff;text-decoration:none;border-radius:8px;padding:10px 18px;font-weight:700;margin-top:10px}
  .cta:hover{background:#0a4fa0}
  .box{background:#fff;border:1px solid var(--rand);border-radius:12px;padding:18px;margin-top:16px}
  .adwrap{margin:22px 0;text-align:center}
  .adlabel{display:block;color:var(--grau);font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
  .hinweis{color:var(--grau);font-size:.8rem;margin-top:20px}
  footer{border-top:1px solid var(--rand);background:#fff;padding:18px 16px;color:var(--grau);font-size:.85rem}
  footer a{color:var(--grau)}
  table{border-collapse:collapse;width:100%}
  td{padding:6px 10px 6px 0;vertical-align:top}
  td:first-child{color:var(--grau);white-space:nowrap}
</style></head><body>
<header><div class="in"><a href="/">Sparkoffer.de</a>
<div class="claim">Handverlesene Reise-Schnäppchen – täglich geprüft</div></div></header>
<main>${inhalt}</main>
<footer><div class="in">
  <a href="/impressum">Impressum</a> · <a href="/datenschutz">Datenschutz</a><br>
  * Links zu Reiseangeboten sind Werbe-/Affiliate-Links: Buchst du darüber, erhalten wir
  eine Provision – für dich ändert sich der Preis nicht. Preise und Verfügbarkeit können
  sich seit der Veröffentlichung geändert haben; maßgeblich ist die Anbieterseite.
</div></footer></body></html>`;
}

function dealKarte(d){
  return `<div class="karte">
    <div>${d.rabatt ? `<span class="rabatt">-${esc(d.rabatt)} %</span>` : ''}</div>
    <a class="titel" href="/deals/${esc(d.slug)}">${esc(d.hotel)}</a>
    <div class="meta">${esc(d.ort || '')}${d.sterne ? ` · ${esc(d.sterne)} Sterne` : ''}${d.bewertung ? ` · ${esc(d.bewertung)}/6` : ''}</div>
    <div class="meta">${d.naechte ? esc(d.naechte) + ' Nächte' : ''}${d.verpflegung ? ' · ' + esc(d.verpflegung) : ''}${d.abflughafen ? ' · ab ' + esc(d.abflughafen) : ''}</div>
    <div><span class="preis">${esc(d.preis_pp)} €<small> p. P.</small></span>
      ${d.statt_pp ? ` <span class="statt">${esc(d.statt_pp)} €</span>` : ''}</div>
  </div>`;
}

module.exports = function portal(app, express){
  app.use(express.json({ limit: '200kb' }));

  /* ---------------- Startseite ---------------- */
  app.get('/', (_q, res) => {
    const deals = dealsLaden().slice().sort((a,b)=> (b.erstellt||'').localeCompare(a.erstellt||''));
    const karten = deals.map(dealKarte).join('');
    /* Nach jeweils 6 Deal-Karten wäre auch ein Anzeigenblock denkbar –
       AdSense-Auto-Anzeigen platzieren aber meist schon selbst. */
    const inhalt = `
      <h1>Aktuelle Reise-Schnäppchen</h1>
      <p class="meta">Unser Deal-Roboter durchsucht täglich tausende Pauschalreisen –
      hier landen nur die Angebote, die wir selbst buchen würden.</p>
      ${adBlock()}
      ${deals.length ? `<div class="karten">${karten}</div>`
        : `<div class="box">Gerade sind keine geprüften Deals online – schau später wieder vorbei!</div>`}
      ${deals.length > 3 ? adBlock() : ''}`;
    res.send(seite({
      titel: 'Sparkoffer.de – Reise-Schnäppchen & Urlaubs-Deals',
      beschreibung: 'Täglich geprüfte Pauschalreise-Deals mit echtem Rabatt: Türkei, Ägypten, Mallorca u. v. m. – handverlesen statt Massenware.',
      kanonisch: '/', inhalt
    }));
  });

  /* ---------------- Deal-Detailseite ---------------- */
  app.get('/deals/:slug', (req, res) => {
    const d = dealsLaden().find(x => x.slug === req.params.slug);
    if (!d) return res.status(404).send(seite({ titel:'Deal nicht gefunden – Sparkoffer.de',
      inhalt:'<h1>Diesen Deal gibt es nicht mehr</h1><p><a href="/">Zurück zu den aktuellen Deals</a></p>' }));
    const link = affiliateUrl(d.url);
    const inhalt = `
      <p class="meta"><a href="/">← Alle Deals</a></p>
      <h1>${esc(d.hotel)}</h1>
      <div class="meta">${esc(d.ort||'')}${d.sterne?` · ${esc(d.sterne)} Sterne`:''}${d.bewertung?` · Bewertung ${esc(d.bewertung)}/6`:''}</div>
      <div class="box">
        <div>${d.rabatt ? `<span class="rabatt">-${esc(d.rabatt)} % gegenüber Vergleichspreis</span>` : ''}</div>
        <p style="margin-top:8px"><span class="preis">${esc(d.preis_pp)} €<small> pro Person</small></span>
          ${d.statt_pp ? ` <span class="statt">statt ${esc(d.statt_pp)} €</span>` : ''}</p>
        <table>
          ${d.von ? `<tr><td>Reisezeitraum</td><td>${esc(datumDe(d.von))} – ${esc(datumDe(d.bis))}</td></tr>` : ''}
          ${d.naechte ? `<tr><td>Dauer</td><td>${esc(d.naechte)} Nächte</td></tr>` : ''}
          ${d.verpflegung ? `<tr><td>Verpflegung</td><td>${esc(d.verpflegung)}</td></tr>` : ''}
          ${d.zimmer ? `<tr><td>Zimmer</td><td>${esc(d.zimmer)}</td></tr>` : ''}
          ${d.abflughafen ? `<tr><td>Abflug</td><td>${esc(d.abflughafen)}</td></tr>` : ''}
        </table>
        ${(d.extras||[]).length ? `<p class="extras">${d.extras.map(e=>`<span>${esc(e)}</span>`).join('')}</p>` : ''}
        ${link ? `<a class="cta" href="${esc(link)}" rel="sponsored nofollow noopener" target="_blank">Zum Angebot *</a>` : ''}
      </div>
      ${adBlock()}
      ${d.kommentar ? `<h2>Warum dieser Deal?</h2><div class="box">${esc(d.kommentar).replace(/\n/g,'<br>')}</div>` : ''}
      <p class="hinweis">Deal geprüft am ${esc(datumDe((d.erstellt||'').slice(0,10)))}.
      Preise können sich seitdem geändert haben.</p>`;
    res.send(seite({
      titel: `${d.hotel} – ${d.preis_pp} € p. P.${d.rabatt?` (-${d.rabatt} %)`:''} | Sparkoffer.de`,
      beschreibung: `${d.hotel}${d.ort?', '+d.ort:''}: ${d.naechte||7} Nächte${d.verpflegung?' '+d.verpflegung:''} ab ${d.preis_pp} € p. P.${d.rabatt?` – ${d.rabatt} % günstiger.`:''}`,
      kanonisch: `/deals/${d.slug}`, inhalt
    }));
  });

  /* ---------------- SEO ---------------- */
  app.get('/robots.txt', (_q, res) => {
    res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n'
      + (CFG.siteUrl ? `Sitemap: ${CFG.siteUrl}/sitemap.xml\n` : ''));
  });
  app.get('/sitemap.xml', (_q, res) => {
    const base = CFG.siteUrl || '';
    const urls = ['/', '/impressum', '/datenschutz', ...dealsLaden().map(d => '/deals/'+d.slug)];
    res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?>\n'
      + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      + urls.map(u => `  <url><loc>${esc(base + u)}</loc></url>`).join('\n')
      + '\n</urlset>');
  });

  /* ---------------- Rechtsseiten (Pflicht in Deutschland!) ---------------- */
  app.get('/impressum', (_q, res) => {
    const i = CFG.impressum;
    const fehlt = !(i.name && i.adresse && i.email);
    res.send(seite({ titel:'Impressum – Sparkoffer.de', kanonisch:'/impressum', inhalt: `
      <h1>Impressum</h1>
      ${fehlt ? `<div class="box" style="border-color:#e11d48"><b>⚠️ Noch unvollständig:</b>
        Setze die Umgebungsvariablen IMPRESSUM_NAME, IMPRESSUM_ADRESSE und IMPRESSUM_EMAIL.
        Ohne vollständiges Impressum darf die Seite in Deutschland nicht öffentlich betrieben
        werden – und Google AdSense lehnt die Bewerbung ab.</div>` : ''}
      <div class="box"><p>Angaben gemäß § 5 DDG:</p>
        <p style="margin-top:8px">${esc(i.name || '[Vor- und Nachname]')}<br>
        ${esc(i.adresse || '[Straße Hausnr., PLZ Ort]').replace(/, /g,'<br>')}<br>
        E-Mail: ${esc(i.email || '[E-Mail-Adresse]')}</p>
        <p style="margin-top:8px">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:
        ${esc(i.name || '[Vor- und Nachname]')}</p></div>` }));
  });
  app.get('/datenschutz', (_q, res) => {
    const i = CFG.impressum;
    res.send(seite({ titel:'Datenschutzerklärung – Sparkoffer.de', kanonisch:'/datenschutz', inhalt: `
      <h1>Datenschutzerklärung</h1>
      <div class="box">
        <h2>Verantwortlicher</h2>
        <p>${esc(i.name || '[Name]')}, ${esc(i.adresse || '[Adresse]')}, ${esc(i.email || '[E-Mail]')}</p>
        <h2>Hosting</h2>
        <p>Diese Website wird bei einem Hosting-Anbieter betrieben. Beim Aufruf werden
        technisch notwendige Daten (IP-Adresse, Zeitpunkt, aufgerufene Seite) in
        Server-Logs verarbeitet (Art. 6 Abs. 1 lit. f DSGVO – Betrieb und Sicherheit).</p>
        <h2>Google AdSense</h2>
        <p>Wir binden Werbung von Google AdSense (Google Ireland Ltd., Dublin) ein. Google
        verwendet dabei Cookies bzw. vergleichbare Technologien, um Anzeigen auszuspielen
        und deren Reichweite zu messen. Dabei können personenbezogene Daten (z. B.
        IP-Adresse) auch in die USA übertragen werden. Rechtsgrundlage ist deine
        Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die du über die Einwilligungsabfrage
        erteilst und jederzeit widerrufen kannst. Details:
        <a href="https://policies.google.com/technologies/ads?hl=de" rel="noopener">policies.google.com</a></p>
        <h2>Affiliate-Links</h2>
        <p>Links zu Reiseangeboten sind Partnerlinks. Klickst du sie an, setzt der
        jeweilige Anbieter ggf. Cookies, um die Vermittlung zuzuordnen.</p>
        <h2>Deine Rechte</h2>
        <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung,
        Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie Beschwerde bei
        einer Aufsichtsbehörde.</p>
        <p class="hinweis">Hinweis: Diese Vorlage ersetzt keine Rechtsberatung. Vor dem
        AdSense-Start zusätzlich eine Consent-Lösung (z. B. Google-zertifizierte
        CMP) einbinden – Google verlangt das für Besucher aus der EU.</p>
      </div>` }));
  });

  /* ---------------- API ---------------- */
  function tokenOk(req){
    return CFG.adminToken && (req.get('X-Admin-Token') === CFG.adminToken || req.query.token === CFG.adminToken);
  }

  app.get('/api/deals', (_q, res) => res.json({ ok:true, deals: dealsLaden() }));

  app.post('/api/deals', (req, res) => {
    if (!tokenOk(req)) return res.status(401).json({ ok:false, error: CFG.adminToken
      ? 'Falsches Admin-Token.' : 'Admin gesperrt: Umgebungsvariable ADMIN_TOKEN setzen.' });
    const b = req.body || {};
    if (!b.hotel || !b.preis_pp) return res.status(400).json({ ok:false, error:'hotel und preis_pp sind Pflicht.' });
    if (!b.kommentar || String(b.kommentar).trim().length < 150)
      return res.status(400).json({ ok:false, error:'Bitte mindestens 150 Zeichen eigenen Kommentar schreiben ("Warum dieser Deal?"). '
        + 'Eigener Text ist Pflicht: Reine Automatik-Seiten lehnt Google AdSense als "Low value content" ab.' });
    const deals = dealsLaden();
    let slug = slugify(b.hotel);
    while (deals.some(d => d.slug === slug)) slug += '-2';
    const deal = { slug,
      hotel: String(b.hotel).slice(0,120), ort: String(b.ort||'').slice(0,80),
      preis_pp: +b.preis_pp || 0, statt_pp: +b.statt_pp || 0, rabatt: +b.rabatt || 0,
      bewertung: String(b.bewertung||'').slice(0,10), sterne: String(b.sterne||'').slice(0,5),
      verpflegung: String(b.verpflegung||'').slice(0,60), zimmer: String(b.zimmer||'').slice(0,80),
      extras: Array.isArray(b.extras) ? b.extras.slice(0,6).map(x=>String(x).slice(0,40)) : [],
      von: String(b.von||'').slice(0,10), bis: String(b.bis||'').slice(0,10),
      naechte: +b.naechte || 0, abflughafen: String(b.abflughafen||'').slice(0,40),
      url: String(b.url||'').slice(0,600), kommentar: String(b.kommentar).slice(0,4000),
      erstellt: new Date().toISOString() };
    deals.unshift(deal);
    dealsSpeichern(deals);
    res.json({ ok:true, deal });
  });

  app.delete('/api/deals/:slug', (req, res) => {
    if (!tokenOk(req)) return res.status(401).json({ ok:false, error:'Falsches oder fehlendes Admin-Token.' });
    const deals = dealsLaden();
    const rest = deals.filter(d => d.slug !== req.params.slug);
    if (rest.length === deals.length) return res.status(404).json({ ok:false, error:'Slug nicht gefunden.' });
    dealsSpeichern(rest);
    res.json({ ok:true });
  });

  /* ---------------- Admin-Oberfläche ---------------- */
  app.get('/admin', (_q, res) => {
    res.send(`<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Sparkoffer Admin</title>
<meta name="robots" content="noindex">
<style>
  body{font-family:system-ui,sans-serif;background:#f5f7fa;margin:0;padding:20px;color:#1c232e}
  .w{max-width:760px;margin:0 auto}
  h1{font-size:1.3rem} h2{font-size:1.05rem;margin-top:24px}
  input,textarea,button{font:inherit;padding:8px;border:1px solid #cdd4de;border-radius:8px;width:100%;box-sizing:border-box;margin-top:4px}
  textarea{min-height:110px}
  label{display:block;margin-top:10px;font-size:.85rem;color:#5b6472}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  button{background:#0a5ec2;color:#fff;border:none;cursor:pointer;font-weight:700;margin-top:14px}
  button.neben{background:#5b6472}
  #status{margin-top:12px;padding:10px;border-radius:8px;display:none}
  .ok{background:#e7f7ec;display:block!important} .fehler{background:#fde8ec;display:block!important}
  .deal{background:#fff;border:1px solid #e3e7ee;border-radius:8px;padding:10px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;gap:10px}
  .deal button{width:auto;margin:0;background:#e11d48;padding:6px 12px}
</style></head><body><div class="w">
<h1>🛠️ Sparkoffer Admin</h1>
<label>Admin-Token <input id="token" type="password" placeholder="ADMIN_TOKEN aus den Umgebungsvariablen"></label>

<h2>1. Deal vom Roboter holen (optional)</h2>
<label>Angebots-Link (check24 / c24n.de) – Daten werden per /link-info ausgelesen
<input id="roboUrl" placeholder="https://urlaub.check24.net/…"></label>
<button class="neben" onclick="holen()">Roboter befragen (dauert 1–3 Min.)</button>

<h2>2. Deal prüfen &amp; veröffentlichen</h2>
<div class="row">
  <label>Hotel* <input id="hotel"></label>
  <label>Ort <input id="ort"></label>
  <label>Preis p. P. (€)* <input id="preis_pp" type="number"></label>
  <label>Statt-Preis p. P. (€) <input id="statt_pp" type="number"></label>
  <label>Rabatt % <input id="rabatt" type="number"></label>
  <label>Bewertung (x,x) <input id="bewertung"></label>
  <label>Sterne <input id="sterne"></label>
  <label>Nächte <input id="naechte" type="number"></label>
  <label>Von (JJJJ-MM-TT) <input id="von"></label>
  <label>Bis (JJJJ-MM-TT) <input id="bis"></label>
  <label>Verpflegung <input id="verpflegung"></label>
  <label>Zimmer <input id="zimmer"></label>
  <label>Abflughafen <input id="abflughafen"></label>
  <label>Extras (Komma-getrennt) <input id="extras"></label>
</div>
<label>Angebots-Link* <input id="url"></label>
<label>Warum dieser Deal?* – dein eigener Text, mind. 150 Zeichen (Pflicht für AdSense-Qualität)
<textarea id="kommentar" placeholder="Z. B.: Für Juli ist das ein starker Preis – vergleichbare 5-Sterne-All-Inclusive-Hotels an der Türkischen Riviera liegen aktuell 30–40 % höher. Das Hotel …"></textarea></label>
<button onclick="veroeffentlichen()">Deal veröffentlichen</button>
<div id="status"></div>

<h2>3. Online-Deals verwalten</h2>
<div id="liste">Lade…</div>
<button class="neben" onclick="exportieren()">Alle Deals als JSON sichern (Backup!)</button>
<p style="font-size:.8rem;color:#5b6472">⚠️ Beim Gratis-Hosting ohne Festplatte (Render Free) gehen
Deals bei jedem Neustart/Deploy verloren – regelmäßig Backup ziehen oder bei Render eine
„Persistent Disk" (Env DATA_DIR auf den Disk-Pfad setzen) hinzubuchen.</p>
</div>
<script>
const F=['hotel','ort','preis_pp','statt_pp','rabatt','bewertung','sterne','naechte','von','bis','verpflegung','zimmer','abflughafen','url'];
function zeig(t,ok){const s=document.getElementById('status');s.textContent=t;s.className=ok?'ok':'fehler';}
async function holen(){
  const u=document.getElementById('roboUrl').value.trim();
  if(!u)return zeig('Bitte erst einen Angebots-Link einfügen.',false);
  zeig('Roboter arbeitet… (bis zu 3 Min., bei kaltem Server länger)',true);
  try{
    const r=await fetch('/link-info?url='+encodeURIComponent(u));
    const j=await r.json();
    if(!j.ok)return zeig('Roboter-Fehler bei "'+(j.step||'?')+'": '+j.error,false);
    const d=j.deal||{};
    for(const k of F)if(d[k]!==undefined)document.getElementById(k).value=d[k];
    document.getElementById('url').value=j.url||u;
    if(d.extras)document.getElementById('extras').value=d.extras.join(', ');
    zeig('Daten übernommen – bitte prüfen und eigenen Kommentar schreiben.',true);
  }catch(e){zeig('Netzwerkfehler: '+e,false);}
}
async function veroeffentlichen(){
  const b={};for(const k of F)b[k]=document.getElementById(k).value.trim();
  b.extras=document.getElementById('extras').value.split(',').map(s=>s.trim()).filter(Boolean);
  b.kommentar=document.getElementById('kommentar').value.trim();
  const r=await fetch('/api/deals',{method:'POST',headers:{'Content-Type':'application/json','X-Admin-Token':document.getElementById('token').value},body:JSON.stringify(b)});
  const j=await r.json();
  if(!j.ok)return zeig(j.error,false);
  zeig('Veröffentlicht: /deals/'+j.deal.slug,true);laden();
}
async function laden(){
  const j=await(await fetch('/api/deals')).json();
  document.getElementById('liste').innerHTML=(j.deals||[]).map(d=>
    '<div class="deal"><span><a href="/deals/'+d.slug+'" target="_blank">'+d.hotel+'</a> – '+d.preis_pp+' € p.P.</span>'+
    '<button onclick="loeschen(\\''+d.slug+'\\')">Löschen</button></div>').join('')||'Noch keine Deals online.';
}
async function loeschen(slug){
  if(!confirm('Deal wirklich löschen?'))return;
  const r=await fetch('/api/deals/'+slug,{method:'DELETE',headers:{'X-Admin-Token':document.getElementById('token').value}});
  const j=await r.json();if(!j.ok)return zeig(j.error,false);laden();
}
async function exportieren(){
  const j=await(await fetch('/api/deals')).json();
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(j.deals,null,2)],{type:'application/json'}));
  a.download='sparkoffer-deals-backup.json';a.click();
}
laden();
</script></body></html>`);
  });
};
