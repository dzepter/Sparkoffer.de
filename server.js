/* Sparkoffer Link-Roboter  (v10 – frame-fähig)
   Der Pauschalreise-Rechner steckt auf check24.net in einem eingebetteten
   Frame (iframe). v10 sucht Eingabefeld, Suchknopf und Ergebniskarten
   deshalb in ALLEN Frames der Seite – das behebt den Fehler
   „deals-lesen: Keine Ergebniskarten gefunden".

   /deal-link  – holt die Hotel-URL für einen bekannten Deal
   /live-deal  – sucht LIVE den besten Deal EINES Ziels
   /best-deal  – vergleicht MEHRERE Ziele, wählt den stärksten Deal,
                 liest Details (Sterne, Bewertung, Verpflegung, Zimmer …) mit aus */

const express = require('express');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const app = express();
app.use((req, res, next) => { res.set('Access-Control-Allow-Origin', '*'); next(); });

app.get(['/','/app'], (_q, r) => {
  const f = path.join(__dirname, 'sparkoffer-app.html');
  if (fs.existsSync(f)) return r.sendFile(f);
  r.send('Sparkoffer Link-Roboter v10 läuft ✅ – Endpoints: /deal-link, /live-deal, /best-deal');
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

/* Alle Frames der Seite (Haupt-Frame zuerst) */
function alleFrames(page){
  const fs = page.frames();
  const main = page.mainFrame();
  return [main, ...fs.filter(f => f !== main)];
}

/* Ersten Frame finden, der den Selektor enthält */
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

/* Frame mit den Suchergebnissen finden (urlaub.check24 oder viele €-Karten) */
async function ergebnisFrame(page, timeoutMs){
  const ende = Date.now() + (timeoutMs || 25000);
  while (Date.now() < ende) {
    for (const f of alleFrames(page)) {
      try { if (/urlaub\.check24|\/suche/i.test(f.url()) &&
                 await f.locator('a,article').filter({ hasText:/€/ }).count() > 2) return f; } catch(_){}
    }
    for (const f of alleFrames(page)) {
      try { if (await f.locator('a,article').filter({ hasText:/€/ }).count() > 4) return f; } catch(_){}
    }
    await page.waitForTimeout(900);
  }
  return page.mainFrame();
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
  /* Das Eingabefeld kann im Haupt-Frame ODER im Rechner-iframe liegen */
  const f = await frameMit(page, DEST_SEL, 20000);
  if (!f) throw new Error('Reiseziel-Eingabefeld in keinem Frame gefunden (Frames: '+
    alleFrames(page).map(x=>x.url().replace(/^https?:\/\//,'').slice(0,60)).join(' | ')+')');

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

  /* Warten, bis IRGENDEIN Frame die Suchergebnisse zeigt (URL /suche oder €-Karten) */
  const ende = Date.now() + 45000;
  while (Date.now() < ende) {
    await page.waitForTimeout(1500);
    await killConsent(page);
    for (const f of alleFrames(page)) {
      try {
        if (/urlaub\.check24\.net\/suche|#\/suche/i.test(f.url())) return;
        if (await f.locator('a,article').filter({ hasText:/€/ }).count() > 4 &&
            /Nächte|p\.P\.|pro Person/i.test(await f.evaluate(()=>document.body.innerText.slice(0,4000)).catch(()=>''))) return;
      } catch(_){}
    }
  }
  throw new Error('Nach dem Suchklick keine Ergebnisseite erkannt (Frames: '+
    alleFrames(page).map(x=>x.url().replace(/^https?:\/\//,'').slice(0,60)).join(' | ')+')');
}

/* --- Ergebniskarten des richtigen Frames einsammeln und bewerten --- */
async function karteLocator(page){
  const f = await ergebnisFrame(page, 25000);
  await page.waitForTimeout(2000);
  await f.evaluate(()=>window.scrollBy(0,900)).catch(()=>{});
  await page.waitForTimeout(2200);
  let karten = f.locator('a[href*="hoteldetail" i], a[href*="angebot" i], a[href*="#/suche" i]').filter({ hasText:/€/ });
  if (!(await karten.count())) karten = f.locator('a').filter({ hasText:/€/ });
  if (!(await karten.count())) karten = f.locator('article, [class*="result" i], [class*="offer" i], [class*="hotel" i]').filter({ hasText:/€/ });
  return { frame:f, karten };
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
  const { frame, karten } = await karteLocator(page);
  const anzahl = Math.min(await karten.count(), maxKarten||15);
  const kandidaten = [];
  for (let i = 0; i < anzahl; i++) {
    const text = (await karten.nth(i).innerText().catch(()=> '')) || '';
    const k = karteParsen(text, i);
    if (k) kandidaten.push(k);
  }
  kandidaten.sort((a,b)=>score(b)-score(a));
  return { frame, karten, kandidaten };
}

/* Nach dem Klick: URL des Angebots ermitteln – öffnet der Klick einen neuen Tab,
   nehmen wir dessen URL; sonst Frame-URL bzw. Seiten-URL. */
async function angebotOeffnen(page, karten, index){
  const ctx = page.context();
  const [neuerTab] = await Promise.all([
    ctx.waitForEvent('page', { timeout:8000 }).catch(()=>null),
    karten.nth(index).click()
  ]);
  const ziel = neuerTab || page;
  await ziel.waitForTimeout(3000);
  await ziel.waitForLoadState('networkidle', { timeout:25000 }).catch(()=>{});
  await killConsent(ziel);
  /* Beste URL wählen: neuer Tab > Frame mit urlaub.check24 > Haupt-URL */
  let url = ziel.url();
  if (!/urlaub\.check24|hotel|angebot|suche/i.test(url)) {
    for (const f of alleFrames(ziel)) {
      if (/urlaub\.check24/i.test(f.url())) { url = f.url(); break; }
    }
  }
  return { ziel, url };
}

/* --- Detailseite auslesen (alle Frames zusammen) --- */
async function detailsLesen(ziel){
  let text = '';
  for (const f of alleFrames(ziel)) {
    text += '\n' + ((await f.evaluate(()=>document.body.innerText).catch(()=> '')) || '');
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
    const { frame, karten } = await karteLocator(page);
    let url = '';
    if (/hoteldetail|hotelId=/i.test(frame.url())) url = frame.url();
    else {
      const treffer = frame.getByText(new RegExp(hotel.split(' ').slice(0,2).join('.{0,3}'),'i')).first();
      let idx = 0;
      if (await treffer.isVisible().catch(()=>false)) {
        /* Karte mit passendem Hotelnamen bevorzugen */
        const n = Math.min(await karten.count(), 12);
        for (let i=0;i<n;i++){
          const t=(await karten.nth(i).innerText().catch(()=> ''))||'';
          if (new RegExp(hotel.split(' ')[0],'i').test(t)) { idx=i; break; }
        }
      }
      const off = await angebotOeffnen(page, karten, idx);
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
    const { karten, kandidaten } = await besteKarteFinden(page, 15);
    if (!kandidaten.length) {
      const info = alleFrames(page).map(f=>f.url().replace(/^https?:\/\//,'').slice(0,60)).join(' | ');
      throw new Error('Keine Ergebniskarten gefunden. Frames: '+info);
    }
    const best = kandidaten[0];

    step='deal-oeffnen'; budget(t0,step);
    const { ziel:zielSeite, url } = await angebotOeffnen(page, karten, best.i);
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
        const { karten, kandidaten } = await besteKarteFinden(page, 12);
        protokoll.push(zielName+': '+kandidaten.length+' Deals, Top-Rabatt '+(kandidaten[0]?kandidaten[0].rabatt+'%':'–'));
        if (!kandidaten.length) continue;
        const top = kandidaten[0];

        if (!bestGlobal || score(top) > score(bestGlobal.kandidat)) bestGlobal = { ziel: zielName, kandidat: top };

        if (top.rabatt >= minRabatt) {
          step = 'deal-oeffnen ('+zielName+')'; budget(t0, step, LIMIT);
          const off = await angebotOeffnen(page, karten, top.i);
          return await antwort(res, browser, off.ziel, off.url, zielName, top, { von, bis, nights, airport, protokoll });
        }
      } catch (e) { protokoll.push(zielName+': Fehler – '+String(e.message||e).slice(0,120)); }
    }

    if (!bestGlobal) throw new Error('In keinem Ziel Deals gefunden. Protokoll: '+protokoll.join(' | '));

    const { ziel: zielName, kandidat } = bestGlobal;
    step = 'bester-nochmal ('+zielName+')'; budget(t0, step, LIMIT);
    await suchmaskeOeffnen(page, { von, bis, nights, airport });
    const formFrame = await zielEintippen(page, zielName);
    await sucheStarten(page, formFrame);
    const { karten, kandidaten } = await besteKarteFinden(page, 12);
    const wieder = kandidaten.find(k => k.name === kandidat.name) || kandidaten[0];
    if (!wieder) throw new Error('Deal beim zweiten Anlauf nicht wiedergefunden. Protokoll: '+protokoll.join(' | '));
    step = 'deal-oeffnen ('+zielName+')'; budget(t0, step, LIMIT);
    const off = await angebotOeffnen(page, karten, wieder.i);
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
app.listen(PORT, () => console.log('Link-Roboter v10 läuft auf Port', PORT));
