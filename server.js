/* Sparkoffer Link-Roboter  (v9)
   /deal-link  – holt die Hotel-URL für einen bekannten Deal
   /live-deal  – sucht LIVE im check24.net-Rechner den besten Deal EINES Ziels
   /best-deal  – NEU: vergleicht MEHRERE Ziele, wählt den stärksten Deal,
                 öffnet die Angebotsseite und liest die Details
                 (Sterne, Bewertung, Verpflegung, Zimmer, Daten) gleich mit aus. */

const express = require('express');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const app = express();
app.use((req, res, next) => { res.set('Access-Control-Allow-Origin', '*'); next(); });

app.get(['/','/app'], (_q, r) => {
  const f = path.join(__dirname, 'sparkoffer-app.html');
  if (fs.existsSync(f)) return r.sendFile(f);
  r.send('Sparkoffer Link-Roboter v9 läuft ✅ – Endpoints: /deal-link, /live-deal, /best-deal');
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

async function killConsent(page){
  for (const t of ['geht klar','Alle akzeptieren','Akzeptieren','Auswahl bestätigen','Zustimmen','Verstanden']) {
    const b = page.getByRole('button', { name:t }).first();
    if (await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); await page.waitForTimeout(400); return; }
  }
  await page.evaluate(() => {
    document.querySelectorAll('#modal,[role="dialog"],[class*="consent" i],[id*="consent" i],[class*="cookie" i],[id*="cookie" i]').forEach(e => {
      const t=(e.innerText||'').toLowerCase();
      if (/cookie|zustimm|akzeptier|datenschutz|einwillig/.test(t)) e.remove();
    });
  }).catch(()=>{});
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

async function zielEintippen(page, text){
  const dest = page.locator('#destination-element, input.c24package-location, input[placeholder*="Reiseziele" i]').first();
  await dest.waitFor({ state:'attached', timeout:15000 });
  const attrappe = page.getByText(/Alle Reiseziele zum Entdecken/i).first();
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
  const item = page.locator('ul.ui-autocomplete li, li.ui-menu-item')
                   .filter({ hasText:new RegExp(wort,'i') }).first();
  if (await item.isVisible().catch(()=>false)) await item.click();
  else { await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); }
  await page.waitForTimeout(800);

  const alleWerte = await page.evaluate(() =>
    [...document.querySelectorAll('input')].map(i => i.value||'').join(' | ')
  ).catch(()=> '');
  if (!new RegExp(wort,'i').test(alleWerte)) {
    await dest.click({ force:true }).catch(()=>{});
    await page.keyboard.type(text, { delay:60 }).catch(()=>{});
    await page.waitForTimeout(1500);
    await page.keyboard.press('Enter').catch(()=>{});
    await page.waitForTimeout(600);
  }
}

async function sucheStarten(page){
  await killConsent(page);
  const btn = page.getByRole('button', { name:/Reise finden|^Suche$|Suchen/i }).first();
  if (await btn.isVisible().catch(()=>false)) await btn.click();
  else await page.keyboard.press('Enter');
  await page.waitForURL(u => /urlaub\.check24\.net\/suche|#\/suche/i.test(u.href), { timeout:40000 });
  await page.waitForLoadState('networkidle', { timeout:30000 }).catch(()=>{});
  await page.waitForTimeout(2500);
  await killConsent(page);
}

function budget(t0, schritt, limit){
  if (Date.now() - t0 > (limit||140000)) throw new Error('Zeitbudget überschritten bei „'+schritt+'" – bitte nochmal versuchen (Server war vermutlich kalt).');
}

/* --- Ergebniskarten einer Suchergebnis-Seite einsammeln und bewerten --- */
async function karteLocator(page){
  await page.waitForTimeout(3500);
  await page.mouse.wheel(0, 900).catch(()=>{});
  await page.waitForTimeout(2200);
  let karten = page.locator('a[href*="hoteldetail" i], a[href*="angebot" i], a[href*="#/suche" i]').filter({ hasText:/€/ });
  if (!(await karten.count())) karten = page.locator('a').filter({ hasText:/€/ });
  if (!(await karten.count())) karten = page.locator('article, [class*="result" i], [class*="offer" i], [class*="hotel" i]').filter({ hasText:/€/ });
  return karten;
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

/* Punktzahl: Rabatt zählt am meisten, gute Bewertung gibt Bonus, sehr hoher Preis Malus */
function score(k){
  const bew = +(k.bewertung||'0').replace(',','.');
  return k.rabatt*10 + (bew>=5?bew*8:0) - (k.preis>1500? (k.preis-1500)/100 : 0);
}

async function besteKarteFinden(page, maxKarten){
  const karten = await karteLocator(page);
  const anzahl = Math.min(await karten.count(), maxKarten||15);
  if (!anzahl) return { karten, kandidaten:[] };
  const kandidaten = [];
  for (let i = 0; i < anzahl; i++) {
    const text = (await karten.nth(i).innerText().catch(()=> '')) || '';
    const k = karteParsen(text, i);
    if (k) kandidaten.push(k);
  }
  kandidaten.sort((a,b)=>score(b)-score(a));
  return { karten, kandidaten };
}

/* --- Detailseite auslesen (nach dem Klick auf den Deal) --- */
async function detailsLesen(page){
  const text = (await page.evaluate(()=>document.body.innerText).catch(()=> '')) || '';
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

/* ============ /deal-link: URL zu einem bekannten Hotel holen ============ */
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
    await zielEintippen(page, hotel);
    step='suchen'; budget(t0,step);
    await sucheStarten(page);
    step='hotel-oeffnen'; budget(t0,step);
    if (!/hoteldetail|hotelId=/i.test(page.url())) {
      const treffer = page.getByText(new RegExp(hotel.split(' ').slice(0,2).join('.{0,3}'),'i')).first();
      await treffer.waitFor({ state:'visible', timeout:25000 });
      await treffer.click();
      await page.waitForTimeout(2500);
    }
    const url = page.url();
    const hotelId = (url.match(/[?&#]hotelId=(\d+)/i)||[])[1]||null;
    await browser.close();
    return res.json({ ok:true, url, hotelId, hotel });
  } catch (e) {
    let seite=''; try{ seite=page?page.url():''; }catch(_){}
    if (browser) await browser.close().catch(()=>{});
    return res.status(500).json({ ok:false, step, seite, error:String(e.message||e).slice(0,500) });
  }
});

/* ============ /live-deal: besten Deal EINES Ziels finden ============ */
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
    await zielEintippen(page, ziel);
    step='suchen'; budget(t0,step);
    await sucheStarten(page);

    step='deals-lesen'; budget(t0,step);
    const { karten, kandidaten } = await besteKarteFinden(page, 15);
    if (!kandidaten.length) {
      const seiteText = (await page.evaluate(() => document.body.innerText.slice(0,300)).catch(()=> '')) || '';
      throw new Error('Keine Ergebniskarten gefunden. Seitenanfang: „'+seiteText.replace(/\s+/g,' ').slice(0,150)+'…"');
    }
    const best = kandidaten[0];

    step='deal-oeffnen'; budget(t0,step);
    await karten.nth(best.i).click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle', { timeout:25000 }).catch(()=>{});

    const url = page.url();
    const hotelId = (url.match(/[?&#]hotelId=(\d+)/i)||[])[1]||null;
    const det = await detailsLesen(page);
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

/* ============ /best-deal: MEHRERE Ziele vergleichen (der Tagesdeal) ============
   Parameter:
   ziele      = kommagetrennt, z.B. "Türkei,Ägypten,Mallorca"  (max. 3 werden geprüft)
   nights     = z.B. 7        airport = z.B. Frankfurt
   von / bis  = Suchfenster (Standard: in 14 bis 49 Tagen)
   minRabatt  = ab dieser Ersparnis wird sofort zugegriffen (Standard 40)      */
app.get('/best-deal', async (req, res) => {
  const ziele = (req.query.ziele || 'Türkei,Ägypten,Mallorca')
    .split(',').map(s=>s.trim()).filter(Boolean).slice(0,3);
  const nights  = req.query.nights || '7';
  const airport = req.query.airport || 'Frankfurt';
  const von     = req.query.von || addDays(null, 14);
  const bis     = req.query.bis || addDays(null, 49);
  const minRabatt = +(req.query.minRabatt || 40);
  const LIMIT = 175000;                      /* die App wartet 210 s */
  const t0 = Date.now();
  let browser, page, step = 'start';
  const protokoll = [];

  try {
    ({ browser, page } = await neuerBrowser());
    let bestGlobal = null;                   /* { ziel, kandidat } */

    for (const ziel of ziele) {
      /* Reicht die Zeit noch für einen weiteren Durchlauf (~45 s)? */
      if (Date.now() - t0 > LIMIT - 55000 && bestGlobal) break;
      try {
        step = 'suchmaske ('+ziel+')'; budget(t0, step, LIMIT);
        await suchmaskeOeffnen(page, { von, bis, nights, airport });
        step = 'reiseziel ('+ziel+')'; budget(t0, step, LIMIT);
        await zielEintippen(page, ziel);
        step = 'suchen ('+ziel+')'; budget(t0, step, LIMIT);
        await sucheStarten(page);
        step = 'deals-lesen ('+ziel+')'; budget(t0, step, LIMIT);
        const { karten, kandidaten } = await besteKarteFinden(page, 12);
        protokoll.push(ziel+': '+kandidaten.length+' Deals, Top-Rabatt '+(kandidaten[0]?kandidaten[0].rabatt+'%':'–'));
        if (!kandidaten.length) continue;
        const top = kandidaten[0];

        if (!bestGlobal || score(top) > score(bestGlobal.kandidat)) bestGlobal = { ziel, kandidat: top };

        /* Volltreffer? Dann direkt hier öffnen und fertig. */
        if (top.rabatt >= minRabatt) {
          step = 'deal-oeffnen ('+ziel+')'; budget(t0, step, LIMIT);
          await karten.nth(top.i).click();
          await page.waitForTimeout(3000);
          await page.waitForLoadState('networkidle', { timeout:25000 }).catch(()=>{});
          return await antwort(res, browser, page, ziel, top, { von, bis, nights, airport, protokoll });
        }
      } catch (e) { protokoll.push(ziel+': Fehler – '+String(e.message||e).slice(0,120)); }
    }

    if (!bestGlobal) throw new Error('In keinem Ziel Deals gefunden. Protokoll: '+protokoll.join(' | '));

    /* Kein Ziel hat den Mindest-Rabatt erreicht → besten gefundenen nochmal ansteuern */
    const { ziel, kandidat } = bestGlobal;
    step = 'bester-nochmal ('+ziel+')'; budget(t0, step, LIMIT);
    await suchmaskeOeffnen(page, { von, bis, nights, airport });
    await zielEintippen(page, ziel);
    await sucheStarten(page);
    const { karten, kandidaten } = await besteKarteFinden(page, 12);
    /* denselben Deal wiederfinden (Name), sonst den aktuell besten nehmen */
    const wieder = kandidaten.find(k => k.name === kandidat.name) || kandidaten[0];
    if (!wieder) throw new Error('Deal beim zweiten Anlauf nicht wiedergefunden. Protokoll: '+protokoll.join(' | '));
    step = 'deal-oeffnen ('+ziel+')'; budget(t0, step, LIMIT);
    await karten.nth(wieder.i).click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle', { timeout:25000 }).catch(()=>{});
    return await antwort(res, browser, page, ziel, wieder, { von, bis, nights, airport, protokoll });

  } catch (e) {
    let seite=''; try{ seite=page?page.url():''; }catch(_){}
    if (browser) await browser.close().catch(()=>{});
    return res.status(500).json({ ok:false, step, seite, protokoll, error:String(e.message||e).slice(0,500) });
  }

  async function antwort(res, browser, page, ziel, k, ctx){
    const url = page.url();
    const hotelId = (url.match(/[?&#]hotelId=(\d+)/i)||[])[1]||null;
    const det = await detailsLesen(page);
    await browser.close();
    return res.json({ ok:true, url, hotelId, protokoll: ctx.protokoll,
      deal:{ hotel:k.name, preis_pp:k.preis, statt_pp:k.statt, rabatt:k.rabatt,
             bewertung:det.bewertung||k.bewertung, sterne:det.sterne||k.sterne,
             verpflegung:det.verpflegung||'', zimmer:det.zimmer||'', extras:det.extras||[],
             ort:ziel, von:det.von||ctx.von, bis:det.bis||ctx.bis,
             naechte:det.naechte||k.naechte||+ctx.nights, abflughafen:ctx.airport } });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Link-Roboter v9 läuft auf Port', PORT));
