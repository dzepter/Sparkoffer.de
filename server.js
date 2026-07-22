/* Sparkoffer Link-Roboter  (v12)
   Neu gegenüber v11:
   – Kartenerkennung über Playwright-Selektoren, die auch in Shadow-DOM /
     Webkomponenten hineinschauen (evaluate/querySelectorAll kann das nicht –
     sehr wahrscheinlich der Grund für „Keine Ergebniskarten gefunden").
   – /version       → zeigt, welche Version wirklich deployed ist
   – /debug-suche   → führt eine Suche aus und zeigt, was der Roboter auf der
                      Ergebnisseite sieht (Frames, Textanfang, Kartenanzahl)

   Endpoints: /link-info, /deal-link, /live-deal, /best-deal, /debug-suche, /version */

const VERSION = 'v14';
const express = require('express');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const app = express();
app.use((req, res, next) => { res.set('Access-Control-Allow-Origin', '*'); next(); });

app.get('/version', (_q, r) => r.json({ ok:true, version: VERSION }));

/* Öffentliches Deal-Portal (Startseite, /deals/…, /admin, AdSense, SEO, Rechtsseiten) */
require('./portal')(app, express);

app.get('/app', (_q, r) => {
  const f = path.join(__dirname, 'sparkoffer-app.html');
  if (fs.existsSync(f)) return r.sendFile(f);
  r.send('Sparkoffer Link-Roboter '+VERSION+' läuft ✅ – Endpoints: /link-info, /deal-link, /live-deal, /best-deal, /debug-suche, /version');
});

/* ---------------- Helfer ---------------- */
const IATA = { 'frankfurt-hahn':'HHN','frankfurt':'FRA','münchen':'MUC','muenchen':'MUC','berlin':'BER',
  'düsseldorf':'DUS','duesseldorf':'DUS','hamburg':'HAM','stuttgart':'STR','köln':'CGN','koeln':'CGN',
  'hannover':'HAJ','leipzig':'LEJ','nürnberg':'NUE','nuernberg':'NUE','dresden':'DRS','bremen':'BRE',
  'dortmund':'DTM','memmingen':'FMM','karlsruhe':'FKB','saarbrücken':'SCN','münster':'FMO','paderborn':'PAD',
  'friedrichshafen':'FDH','erfurt':'ERF','weeze':'NRN','basel':'BSL','wien':'VIE','zürich':'ZRH' };
function iata(n){ n=(n||'').trim(); if(/^[A-Z]{3}$/.test(n)) return n;
  const l=n.toLowerCase(); for(const k in IATA) if(l.includes(k)) return IATA[k]; return 'FRA'; }
function addDays(iso,d){ const t=iso?new Date(iso):new Date(); if(isNaN(t)) return iso;
  t.setDate(t.getDate()+d); return t.toISOString().slice(0,10); }
function budget(t0, schritt, limit){
  if (Date.now() - t0 > (limit||140000)) throw new Error('Zeitbudget überschritten bei „'+schritt+'" – bitte nochmal versuchen (Server war vermutlich kalt).');
}

function alleFrames(page){
  const fr = page.frames();
  const main = page.mainFrame();
  return [main, ...fr.filter(f => f !== main)];
}
function frameListe(page){
  return alleFrames(page).map(x=>x.url().replace(/^https?:\/\//,'').slice(0,70)).join(' | ');
}
function rechnerFrame(page){
  return alleFrames(page).find(x => /urlaub\.check24/i.test(x.url())) || null;
}
async function frameMit(page, selector, timeoutMs){
  const ende = Date.now() + (timeoutMs || 15000);
  while (Date.now() < ende) {
    for (const f of alleFrames(page)) {
      try { if (await f.locator(selector).count()) return f; } catch(_){}
    }
    await page.waitForTimeout(700);
  }
  return null;
}

async function killConsent(page){
  for (const f of alleFrames(page)) {
    for (const t of ['geht klar','Alle akzeptieren','Akzeptieren','Auswahl bestätigen','Zustimmen','Verstanden']) {
      try {
        const b = f.getByRole('button', { name:t }).first();
        if (await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); await page.waitForTimeout(400); }
      } catch(_){}
    }
    await f.evaluate(() => {
      document.querySelectorAll('#modal,[role="dialog"],[class*="consent" i],[id*="consent" i],[class*="cookie" i],[id*="cookie" i]').forEach(e => {
        const t=(e.innerText||'').toLowerCase();
        if (/cookie|zustimm|akzeptier|datenschutz|einwillig/.test(t)) e.remove();
      });
    }).catch(()=>{});
  }
}

async function neuerBrowser(){
  const browser = await chromium.launch({ headless:true, args:['--no-sandbox'] });
  const context = await browser.newContext({
    locale:'de-DE', viewport:{ width:1440, height:900 },
    userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  return { browser, context, page };
}

async function suchmaskeOeffnen(page, { von, bis, nights, airport, erwachsene, kinder }){
  const p = new URLSearchParams({
    c24pp_departure_date: von, c24pp_return_date: bis,
    c24pp_travel_duration: nights, c24pp_airport: iata(airport),
    c24pp_adult: String(erwachsene||2), c24pp_childrenCount: String(kinder||0)
  });
  await page.goto('https://www.check24.net/pauschalreisen-vergleich/?'+p.toString(), { waitUntil:'domcontentloaded' });
  await page.waitForTimeout(2500);
  await killConsent(page);
  await page.waitForLoadState('networkidle', { timeout:15000 }).catch(()=>{});
  await killConsent(page);
}

const DEST_SEL = '#destination-element, input.c24package-location, input[placeholder*="Reiseziele" i], input[placeholder*="Reiseziel" i], input[placeholder*="Hotel" i]';

async function zielEintippen(page, text){
  const f = await frameMit(page, DEST_SEL, 20000);
  if (!f) throw new Error('Reiseziel-Eingabefeld in keinem Frame gefunden (Frames: '+frameListe(page)+')');

  const dest = f.locator(DEST_SEL).first();
  const attrappe = f.getByText(/Alle Reiseziele zum Entdecken/i).first();
  if (await attrappe.isVisible().catch(()=>false)) await attrappe.click({ force:true }).catch(()=>{});
  await page.waitForTimeout(400);
  if (!(await dest.isVisible().catch(()=>false))) {
    await dest.evaluate(el => { el.style.cssText += ';display:block;visibility:visible;opacity:1;';
      el.removeAttribute('readonly'); }).catch(()=>{});
  }
  await dest.click({ force:true }).catch(()=>{});
  await dest.evaluate(el => { el.value=''; el.focus(); }).catch(()=>{});
  await page.keyboard.type(text, { delay:80 });

  let val = await dest.evaluate(el => el.value).catch(()=> '');
  if (!val) {
    await dest.evaluate((el, t) => {
      el.value = t;
      el.dispatchEvent(new Event('input', { bubbles:true }));
      el.dispatchEvent(new KeyboardEvent('keydown', { bubbles:true, key:'a' }));
      el.dispatchEvent(new KeyboardEvent('keyup',   { bubbles:true, key:'a' }));
    }, text).catch(()=>{});
  }
  await page.waitForTimeout(2200);

  const wort = text.split(' ')[0];
  const item = f.locator('ul.ui-autocomplete li, li.ui-menu-item')
                .filter({ hasText:new RegExp(wort,'i') }).first();
  if (await item.isVisible().catch(()=>false)) await item.click();
  else { await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); }
  await page.waitForTimeout(800);

  const alleWerte = await f.evaluate(() =>
    [...document.querySelectorAll('input')].map(i => i.value||'').join(' | ')
  ).catch(()=> '');
  if (!new RegExp(wort,'i').test(alleWerte)) {
    await dest.click({ force:true }).catch(()=>{});
    await page.keyboard.type(text, { delay:60 }).catch(()=>{});
    await page.waitForTimeout(1500);
    await page.keyboard.press('Enter').catch(()=>{});
    await page.waitForTimeout(600);
  }
  return f;
}

async function sucheStarten(page, formFrame){
  await killConsent(page);
  let geklickt = false;
  for (const f of [formFrame, ...alleFrames(page)].filter(Boolean)) {
    try {
      const btn = f.getByRole('button', { name:/Reise finden|^Suche$|Suchen|Angebote/i }).first();
      if (await btn.isVisible().catch(()=>false)) { await btn.click(); geklickt = true; break; }
    } catch(_){}
  }
  if (!geklickt) await page.keyboard.press('Enter');

  const ende = Date.now() + 45000;
  while (Date.now() < ende) {
    await page.waitForTimeout(1500);
    await killConsent(page);
    for (const f of alleFrames(page)) {
      try {
        if (/urlaub\.check24\.net\/suche|#\/suche/i.test(f.url())) return;
        if (await f.locator('a,article').filter({ hasText:/€/ }).count() > 4) return;
      } catch(_){}
    }
  }
  throw new Error('Nach dem Suchklick keine Ergebnisseite erkannt (Frames: '+frameListe(page)+')');
}

/* --- Kartenerkennung (v12): Playwright-Selektoren durchdringen Shadow-DOM --- */
function kartenLocator(frame){
  return frame.locator('a, article, li, section, div')
    .filter({ hasText: /€/ })
    .filter({ hasText: /Nächte|p\.P\.?|pro Person|Übernacht/i });
}

async function kartenSammeln(frame){
  const loc = kartenLocator(frame);
  const n = Math.min(await loc.count().catch(()=>0), 250);
  const roh = [];
  for (let i = 0; i < n; i++) {
    let t = (await loc.nth(i).innerText().catch(()=> '')) || '';
    if (!t) t = (await loc.nth(i).textContent().catch(()=> '')) || '';
    t = t.trim();
    if (t.length > 60 && t.length < 1600) roh.push({ i, text: t });
  }
  /* Verschachtelte Container derselben Karte haben (fast) identischen Text →
     pro Text nur den letzten (innersten) Treffer behalten */
  const map = new Map();
  for (const r of roh) map.set(r.text.replace(/\s+/g,' ').slice(0, 280), r);
  return { loc, karten: [...map.values()].slice(0, 20) };
}

function karteParsen(text, i){
  const statt = +( (text.match(/statt\s*([\d.]+)\s*€/i)||[])[1]||'' ).replace(/\./g,'');
  const alle = [...text.matchAll(/([\d.]{2,7})\s*€/g)].map(m => +m[1].replace(/\./g,'')).filter(p => p >= 100 && p < 20000);
  const preis = alle.length ? Math.min(...alle) : 0;
  if (!preis) return null;
  const rabatt = statt && statt > preis ? Math.round((1 - preis/statt) * 100) : 0;
  const zeilen = text.split('\n').map(s=>s.trim()).filter(Boolean);
  const name = zeilen.find(z => !/€|Nächte|inkl\.|p\.P|statt|%|Flug|Transfer/i.test(z) && z.length > 5) || zeilen[0] || 'Hotel';
  const bewertung = (text.match(/(\d,\d)\s*\/\s*6/)||[])[1] || '';
  const sterne = (text.match(/(\d)(?:[.,]5)?\s*(?:Sterne|★)/i)||[])[1] || '';
  const naechte = +((text.match(/(\d{1,2})\s*(?:Nächte|Tage)/i)||[])[1]||0);
  const dts=[...text.matchAll(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})?/g)];
  return { i, name, preis, statt: statt||0, rabatt, bewertung, sterne, naechte,
           daten: dts.slice(0,2).map(m=>m[0]) };
}

function score(k){
  const bew = +(k.bewertung||'0').replace(',','.');
  return k.rabatt*10 + (bew>=5?bew*8:0) - (k.preis>1500? (k.preis-1500)/100 : 0);
}

async function besteKarteFinden(page, maxKarten){
  let f = rechnerFrame(page) || page.mainFrame();
  const ende = Date.now() + 50000;          /* Ergebnisse laden oft 10–30 s nach */
  let loc = null, karten = [];
  while (Date.now() < ende) {
    f = rechnerFrame(page) || f;
    const res = await kartenSammeln(f).catch(()=>({ loc:null, karten:[] }));
    loc = res.loc; karten = res.karten;
    if (karten.length) break;
    await f.evaluate(()=>window.scrollBy(0,800)).catch(()=>{});
    await page.waitForTimeout(2500);
    await killConsent(page);
  }
  const kandidaten = karten.map(k => karteParsen(k.text, k.i)).filter(Boolean)
                           .slice(0, maxKarten || 15);
  kandidaten.sort((a,b)=>score(b)-score(a));
  return { frame:f, loc, kandidaten };
}

async function karteKlicken(page, loc, i){
  const el = loc.nth(i);
  await el.scrollIntoViewIfNeeded().catch(()=>{});
  const ctx = page.context();
  const [neuerTab] = await Promise.all([
    ctx.waitForEvent('page', { timeout: 8000 }).catch(()=>null),
    el.click({ force:true }).catch(async ()=>{ await el.locator('a').first().click({ force:true }).catch(()=>{}); })
  ]);
  const ziel = neuerTab || page;
  await ziel.waitForTimeout(3000);
  await ziel.waitForLoadState('networkidle', { timeout: 25000 }).catch(()=>{});
  await killConsent(ziel);
  let url = ziel.url();
  const f = rechnerFrame(ziel);
  if (f && (!/urlaub\.check24/i.test(url) || /hotel|angebot|hotelId/i.test(f.url()))) url = f.url();
  return { ziel, url };
}

/* --- Detailseite auslesen (alle Frames, Shadow-DOM-fest über Locator-Text) --- */
async function detailsLesen(ziel){
  let text = '';
  for (const f of alleFrames(ziel)) {
    text += '\n' + ((await f.locator('body').innerText({ timeout:5000 }).catch(()=> '')) || '');
  }
  const d = {};
  let m = text.match(/All[- ]?Inclusive(?:\s*Plus)?|Halbpension\s*Plus|Halbpension|Vollpension|Frühstück|Nur Übernachtung/i);
  if (m) d.verpflegung = m[0];
  m = text.match(/(Doppelzimmer|Familienzimmer|Studio|Suite|Appartement|Bungalow)[^\n·|,(]{0,45}/i);
  if (m) d.zimmer = m[0].trim();
  m = text.match(/(\d(?:[.,]5)?)\s*(?:Sterne|-Sterne)/i);
  if (m) d.sterne = m[1].replace('.',',');
  m = text.match(/(\d,\d)\s*\/\s*6/);
  if (m) d.bewertung = m[1];
  const dts=[...text.matchAll(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/g)].slice(0,2);
  if (dts.length===2){
    const iso = x => `${x[3].length===2?'20'+x[3]:x[3]}-${String(+x[2]).padStart(2,'0')}-${String(+x[1]).padStart(2,'0')}`;
    d.von = iso(dts[0]); d.bis = iso(dts[1]);
  }
  m = text.match(/(\d{1,2})\s*Nächte/i);
  if (m) d.naechte = +m[1];
  const extras = [];
  for (const [re, label] of [[/direkt.{0,12}strand|strandlage/i,'Direkte Strandlage'],[/pool/i,'Pool'],
    [/klimaanlage/i,'Klimaanlage'],[/wlan|wifi/i,'WLAN'],[/transfer/i,'Inkl. Transfer'],
    [/adults\s*only/i,'Adults Only'],[/rutsch|aquapark/i,'Wasserrutschen'],[/spa|wellness/i,'Wellness/Spa'],
    [/animation|kinderclub|miniclub/i,'Kinderprogramm']]) {
    if (re.test(text)) extras.push(label);
  }
  d.extras = extras.slice(0,4);
  return d;
}

/* ============ /debug-suche: zeigt, was der Roboter sieht ============ */
app.get('/debug-suche', async (req, res) => {
  const ziel    = (req.query.ziel || 'Türkei').trim();
  const airport = req.query.airport || 'Frankfurt';
  const von = req.query.von || addDays(null, 21);
  const bis = req.query.bis || addDays(null, 49);
  let browser, page, step='start';
  try {
    ({ browser, page } = await neuerBrowser());
    step='suchmaske';
    await suchmaskeOeffnen(page, { von, bis, nights:'7', airport });
    step='reiseziel';
    const formFrame = await zielEintippen(page, ziel);
    step='suchen';
    await sucheStarten(page, formFrame);
    step='analyse';
    await page.waitForTimeout(8000);
    const f = rechnerFrame(page) || page.mainFrame();
    const bodyText = (await f.locator('body').innerText({ timeout:8000 }).catch(()=> '')) || '';
    const euroZahl = (bodyText.match(/€/g)||[]).length;
    const { karten } = await kartenSammeln(f);
    await browser.close();
    return res.json({ ok:true, version:VERSION,
      frames: frameListe(page).split(' | '),
      ergebnisFrame: f.url().slice(0,120),
      textAnfang: bodyText.replace(/\s+/g,' ').slice(0,500),
      euroZeichenImText: euroZahl,
      kartenGefunden: karten.length,
      kartenBeispiele: karten.slice(0,3).map(k => k.text.replace(/\s+/g,' ').slice(0,220))
    });
  } catch (e) {
    let frames=''; try{ frames=page?frameListe(page):''; }catch(_){}
    if (browser) await browser.close().catch(()=>{});
    return res.status(500).json({ ok:false, version:VERSION, step, frames, error:String(e.message||e).slice(0,400) });
  }
});

/* ============ /link-info: DU bringst den Link – der Roboter liest die Daten ============
   ?url=<Angebots-Link>  (check24-Angebotsseite oder c24n.de-Kurzlink)
   Öffnet die Seite, folgt Weiterleitungen, liest Hotel, Preise, Bewertung,
   Sterne, Verpflegung, Zimmer, Reisedaten, Nächte, Abflughafen und Extras. */
app.get('/link-info', async (req, res) => {
  const rawUrl = (req.query.url || '').trim();
  if (!/^https?:\/\//i.test(rawUrl)) return res.status(400).json({ ok:false, step:'input', error:'Parameter "url" fehlt oder ist keine vollständige Adresse (muss mit https:// beginnen).' });
  if (!/check24|c24n\.de/i.test(rawUrl)) return res.status(400).json({ ok:false, step:'input', error:'Bitte einen check24- oder c24n.de-Link einfügen.' });
  const t0 = Date.now();
  let browser, page, step = 'start';
  try {
    ({ browser, page } = await neuerBrowser());
    step='seite-oeffnen'; budget(t0,step);
    await page.goto(rawUrl, { waitUntil:'domcontentloaded', timeout:45000 });
    await page.waitForTimeout(3000);
    await killConsent(page);
    await page.waitForLoadState('networkidle', { timeout:25000 }).catch(()=>{});
    await killConsent(page);
    await page.waitForTimeout(2500);
    /* etwas scrollen, damit nachladende Bereiche (Preise, Details) erscheinen */
    for (const y of [600, 1200, 1800]) {
      await page.evaluate(v=>window.scrollTo(0,v), y).catch(()=>{});
      await page.waitForTimeout(900);
    }

    step='daten-lesen'; budget(t0,step);
    /* Text aus ALLEN Frames einsammeln (Rechner-Frame zuerst, falls vorhanden) */
    let text = '';
    const rf = rechnerFrame(page);
    const reihenfolge = rf ? [rf, ...alleFrames(page).filter(f=>f!==rf)] : alleFrames(page);
    for (const f of reihenfolge) {
      text += '\n' + ((await f.locator('body').innerText({ timeout:8000 }).catch(()=> '')) || '');
    }
    if (text.replace(/\s+/g,'').length < 200) throw new Error('Seite scheint leer geladen zu sein – bitte nochmal versuchen.');

    const titel = (await page.title().catch(()=> '')) || '';
    const d = {};

    /* Hotelname: aus dem Seitentitel („Hotelname, Ort | CHECK24“) oder erster passender Zeile */
    let m = titel.match(/^([^|–\-]{4,70}?)(?:,| \||$)/);
    if (m) d.hotel = m[1].trim();
    if (!d.hotel || /check24|urlaub|pauschalreise/i.test(d.hotel)) {
      const zeilen = text.split('\n').map(s=>s.trim()).filter(Boolean);
      d.hotel = zeilen.find(z => /Hotel|Resort|Club|Aparthotel|Iberostar|Riu|Lopesan|Barcelo|TUI/i.test(z)
                 && !/€|Nächte|Bewertung|Merkzettel/i.test(z) && z.length>5 && z.length<70) || '';
    }
    /* Ort: Titelteil nach dem Komma oder „in <Ort>“ */
    m = titel.match(/,\s*([^|–\-]{3,40}?)\s*(?:\||$)/);
    if (m) d.ort = m[1].trim();

    /* Preise: p.P. bevorzugen, sonst Gesamtpreis/2 */
    m = text.match(/([\d.]{3,7})\s*€\s*(?:p\.\s*P|pro\s*Person)/i);
    if (m) d.preis_pp = +m[1].replace(/\./g,'');
    let gesamt = 0;
    m = text.match(/Gesamtpreis[^\d€]{0,25}([\d.]{3,7})\s*€/i) || text.match(/gesamt[^\d€]{0,15}([\d.]{3,7})\s*€/i);
    if (m) gesamt = +m[1].replace(/\./g,'');
    if (!d.preis_pp && gesamt) d.preis_pp = Math.round(gesamt/2);
    if (!d.preis_pp) {
      const alle = [...text.matchAll(/([\d.]{3,7})\s*€/g)].map(x=>+x[1].replace(/\./g,'')).filter(p=>p>=150&&p<20000);
      if (alle.length) d.preis_pp = Math.min(...alle);
    }
    m = text.match(/statt\s*([\d.]{3,7})\s*€\s*(?:p\.\s*P|pro\s*Person)/i) || text.match(/statt\s*([\d.]{3,7})\s*€/i);
    if (m) {
      let s = +m[1].replace(/\./g,'');
      if (gesamt && s > gesamt*0.8) s = Math.round(s/2);   /* „statt“ bezog sich auf Gesamtpreis */
      if (d.preis_pp && s > d.preis_pp) d.statt_pp = s;
    }

    /* Bewertung (x,x/6, x,x/10 oder nach „Bewertung“), Sterne */
    m = text.match(/(\d,\d)\s*\/\s*(?:6|10)/) || text.match(/Bewertung[^\d]{0,12}(\d,\d)/i) || text.match(/(\d,\d)\s*(?:sehr gut|gut|hervorragend)/i);
    if (m) d.bewertung = m[1];
    m = text.match(/(\d(?:[.,]5)?)\s*(?:Sterne|-Sterne|★)/i);
    if (m) d.sterne = m[1].replace('.',',');

    /* Verpflegung, Zimmer, Daten, Nächte, Extras (wie gehabt) */
    m = text.match(/All[- ]?Inclusive(?:\s*Plus)?|Halbpension\s*Plus|Halbpension|Vollpension|Frühstück|Nur Übernachtung/i);
    if (m) d.verpflegung = m[0];
    m = text.match(/(Doppelzimmer|Familienzimmer|Studio|Suite|Appartement|Bungalow)[^\n·|,(]{0,45}/i);
    if (m) d.zimmer = m[0].trim();
    const dts=[...text.matchAll(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/g)].slice(0,2);
    if (dts.length===2){
      const iso = x => `${x[3].length===2?'20'+x[3]:x[3]}-${String(+x[2]).padStart(2,'0')}-${String(+x[1]).padStart(2,'0')}`;
      d.von = iso(dts[0]); d.bis = iso(dts[1]);
    }
    m = text.match(/(\d{1,2})\s*Nächte/i);
    if (m) d.naechte = +m[1];
    m = text.match(/(?:ab|Abflug(?:hafen)?:?\s*)\s+(Frankfurt(?:-Hahn)?|München|Berlin|Düsseldorf|Hamburg|Stuttgart|Köln(?:\/Bonn)?|Hannover|Leipzig(?:-Halle)?|Nürnberg|Dresden|Bremen|Dortmund|Memmingen|Karlsruhe|Münster|Paderborn|Wien|Zürich|Basel)/i);
    if (m) d.abflughafen = m[1];
    const extras = [];
    for (const [re, label] of [[/direkt.{0,12}strand|strandlage/i,'Direkte Strandlage'],[/pool/i,'Pool'],
      [/klimaanlage/i,'Klimaanlage'],[/wlan|wifi/i,'WLAN'],[/transfer/i,'Inkl. Transfer'],
      [/adults\s*only/i,'Adults Only'],[/rutsch|aquapark/i,'Wasserrutschen'],[/spa|wellness/i,'Wellness/Spa'],
      [/animation|kinderclub|miniclub/i,'Kinderprogramm']]) {
      if (re.test(text)) extras.push(label);
    }
    d.extras = extras.slice(0,4);
    if (d.preis_pp && d.statt_pp) d.rabatt = Math.round((1-d.preis_pp/d.statt_pp)*100);

    /* Endgültige URL nach Weiterleitungen (bei c24n.de-Kurzlinks die Angebotsseite) */
    let url = page.url();
    if (rf && /hotel|angebot|suche/i.test(rf.url())) url = rf.url();
    const hotelId = ((url+text).match(/[?&#]hotelId=(\d+)/i)||[])[1]||null;
    const gefunden = ['hotel','preis_pp','statt_pp','bewertung','sterne','verpflegung','zimmer','von','bis','naechte','abflughafen','ort']
      .filter(k => d[k]!==undefined && d[k]!=='' );
    await browser.close();
    return res.json({ ok:true, url, eingabeUrl: rawUrl, hotelId, gefunden, deal:d });
  } catch (e) {
    let seite=''; try{ seite=page?page.url():''; }catch(_){}
    if (browser) await browser.close().catch(()=>{});
    return res.status(500).json({ ok:false, step, seite, error:String(e.message||e).slice(0,500) });
  }
});

/* ============ /deal-link ============ */
app.get('/deal-link', async (req, res) => {
  const { hotel, von, bis, nights, airport } = req.query;
  if (!hotel) return res.status(400).json({ ok:false, step:'input', error:'Parameter "hotel" fehlt' });
  const t0 = Date.now();
  let browser, page, step = 'start';
  try {
    ({ browser, page } = await neuerBrowser());
    step='suchmaske'; budget(t0,step);
    await suchmaskeOeffnen(page, { von: addDays(von,-1), bis: addDays(bis,7), nights: nights||'7', airport });
    step='reiseziel'; budget(t0,step);
    const formFrame = await zielEintippen(page, hotel);
    step='suchen'; budget(t0,step);
    await sucheStarten(page, formFrame);
    step='hotel-oeffnen'; budget(t0,step);
    let url = '';
    const rf = rechnerFrame(page);
    if (rf && /hoteldetail|hotelId=/i.test(rf.url())) url = rf.url();
    else {
      const { loc, kandidaten } = await besteKarteFinden(page, 12);
      if (!kandidaten.length) throw new Error('Keine Ergebniskarten gefunden ['+VERSION+']. Frames: '+frameListe(page));
      const wort = hotel.split(' ')[0];
      const passend = kandidaten.find(k => new RegExp(wort,'i').test(k.name)) || kandidaten[0];
      const off = await karteKlicken(page, loc, passend.i);
      url = off.url;
    }
    const hotelId = (url.match(/[?&#]hotelId=(\d+)/i)||[])[1]||null;
    await browser.close();
    return res.json({ ok:true, url, hotelId, hotel });
  } catch (e) {
    let seite=''; try{ seite=page?page.url():''; }catch(_){}
    if (browser) await browser.close().catch(()=>{});
    return res.status(500).json({ ok:false, step, seite, error:String(e.message||e).slice(0,500) });
  }
});

/* ============ /live-deal ============ */
app.get('/live-deal', async (req, res) => {
  const ziel    = (req.query.ziel || 'Türkei').trim();
  const nights  = req.query.nights || '7';
  const airport = req.query.airport || 'Frankfurt';
  const von     = req.query.von || addDays(null, 21);
  const bis     = req.query.bis || addDays(null, 49);
  const t0 = Date.now();
  let browser, page, step = 'start';
  try {
    ({ browser, page } = await neuerBrowser());
    step='suchmaske'; budget(t0,step);
    await suchmaskeOeffnen(page, { von, bis, nights, airport });
    step='reiseziel'; budget(t0,step);
    const formFrame = await zielEintippen(page, ziel);
    step='suchen'; budget(t0,step);
    await sucheStarten(page, formFrame);

    step='deals-lesen'; budget(t0,step);
    const { loc, kandidaten } = await besteKarteFinden(page, 15);
    if (!kandidaten.length) throw new Error('Keine Ergebniskarten gefunden ['+VERSION+']. Frames: '+frameListe(page));
    const best = kandidaten[0];

    step='deal-oeffnen'; budget(t0,step);
    const { ziel:zielSeite, url } = await karteKlicken(page, loc, best.i);
    const hotelId = (url.match(/[?&#]hotelId=(\d+)/i)||[])[1]||null;
    const det = await detailsLesen(zielSeite);
    await browser.close();
    return res.json({ ok:true, url, hotelId,
      deal:{ hotel:best.name, preis_pp:best.preis, statt_pp:best.statt, rabatt:best.rabatt,
             bewertung:det.bewertung||best.bewertung, sterne:det.sterne||best.sterne,
             verpflegung:det.verpflegung||'', zimmer:det.zimmer||'', extras:det.extras||[],
             ort:ziel, von:det.von||von, bis:det.bis||bis,
             naechte:det.naechte||+nights, abflughafen:airport } });
  } catch (e) {
    let seite=''; try{ seite=page?page.url():''; }catch(_){}
    if (browser) await browser.close().catch(()=>{});
    return res.status(500).json({ ok:false, step, seite, error:String(e.message||e).slice(0,500) });
  }
});

/* ============ /best-deal: MEHRERE Ziele vergleichen ============ */
app.get('/best-deal', async (req, res) => {
  const ziele = (req.query.ziele || 'Türkei,Ägypten,Mallorca')
    .split(',').map(s=>s.trim()).filter(Boolean).slice(0,3);
  const nights  = req.query.nights || '7';
  const airport = req.query.airport || 'Frankfurt';
  const von     = req.query.von || addDays(null, 14);
  const bis     = req.query.bis || addDays(null, 49);
  const minRabatt = +(req.query.minRabatt || 40);
  const LIMIT = 175000;
  const t0 = Date.now();
  let browser, page, step = 'start';
  const protokoll = [];

  try {
    ({ browser, page } = await neuerBrowser());
    let bestGlobal = null;

    for (const zielName of ziele) {
      if (Date.now() - t0 > LIMIT - 55000 && bestGlobal) break;
      try {
        step = 'suchmaske ('+zielName+')'; budget(t0, step, LIMIT);
        await suchmaskeOeffnen(page, { von, bis, nights, airport });
        step = 'reiseziel ('+zielName+')'; budget(t0, step, LIMIT);
        const formFrame = await zielEintippen(page, zielName);
        step = 'suchen ('+zielName+')'; budget(t0, step, LIMIT);
        await sucheStarten(page, formFrame);
        step = 'deals-lesen ('+zielName+')'; budget(t0, step, LIMIT);
        const { loc, kandidaten } = await besteKarteFinden(page, 12);
        protokoll.push(zielName+': '+kandidaten.length+' Deals, Top-Rabatt '+(kandidaten[0]?kandidaten[0].rabatt+'%':'–'));
        if (!kandidaten.length) continue;
        const top = kandidaten[0];

        if (!bestGlobal || score(top) > score(bestGlobal.kandidat)) bestGlobal = { ziel: zielName, kandidat: top };

        if (top.rabatt >= minRabatt) {
          step = 'deal-oeffnen ('+zielName+')'; budget(t0, step, LIMIT);
          const off = await karteKlicken(page, loc, top.i);
          return await antwort(res, browser, off.ziel, off.url, zielName, top, { von, bis, nights, airport, protokoll });
        }
      } catch (e) { protokoll.push(zielName+': Fehler – '+String(e.message||e).slice(0,120)); }
    }

    if (!bestGlobal) throw new Error('In keinem Ziel Deals gefunden ['+VERSION+']. Protokoll: '+protokoll.join(' | '));

    const { ziel: zielName, kandidat } = bestGlobal;
    step = 'bester-nochmal ('+zielName+')'; budget(t0, step, LIMIT);
    await suchmaskeOeffnen(page, { von, bis, nights, airport });
    const formFrame = await zielEintippen(page, zielName);
    await sucheStarten(page, formFrame);
    const { loc, kandidaten } = await besteKarteFinden(page, 12);
    const wieder = kandidaten.find(k => k.name === kandidat.name) || kandidaten[0];
    if (!wieder) throw new Error('Deal beim zweiten Anlauf nicht wiedergefunden. Protokoll: '+protokoll.join(' | '));
    step = 'deal-oeffnen ('+zielName+')'; budget(t0, step, LIMIT);
    const off = await karteKlicken(page, loc, wieder.i);
    return await antwort(res, browser, off.ziel, off.url, zielName, wieder, { von, bis, nights, airport, protokoll });

  } catch (e) {
    let seite=''; try{ seite=page?page.url():''; }catch(_){}
    if (browser) await browser.close().catch(()=>{});
    return res.status(500).json({ ok:false, step, seite, protokoll, error:String(e.message||e).slice(0,500) });
  }

  async function antwort(res, browser, zielSeite, url, zielName, k, ctx){
    const hotelId = (url.match(/[?&#]hotelId=(\d+)/i)||[])[1]||null;
    const det = await detailsLesen(zielSeite);
    await browser.close();
    return res.json({ ok:true, url, hotelId, protokoll: ctx.protokoll,
      deal:{ hotel:k.name, preis_pp:k.preis, statt_pp:k.statt, rabatt:k.rabatt,
             bewertung:det.bewertung||k.bewertung, sterne:det.sterne||k.sterne,
             verpflegung:det.verpflegung||'', zimmer:det.zimmer||'', extras:det.extras||[],
             ort:zielName, von:det.von||ctx.von, bis:det.bis||ctx.bis,
             naechte:det.naechte||k.naechte||+ctx.nights, abflughafen:ctx.airport } });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Link-Roboter '+VERSION+' läuft auf Port', PORT));
