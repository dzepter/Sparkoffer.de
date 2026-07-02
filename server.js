/* Sparkoffer Link-Roboter  (v7)
   /deal-link  – holt die Hotel-URL für einen bekannten Deal
   /live-deal  – NEU: sucht LIVE im check24.net-Rechner den besten Deal
                 (höchste Ersparnis) und liefert Daten + Original-URL     */

const express = require('express');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const app = express();
app.use((req, res, next) => { res.set('Access-Control-Allow-Origin', '*'); next(); });

app.get(['/','/app'], (_q, r) => {
  const f = path.join(__dirname, 'sparkoffer-app.html');
  if (fs.existsSync(f)) return r.sendFile(f);
  r.send('Sparkoffer Link-Roboter läuft ✅  – Endpoints: /deal-link, /live-deal');
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

async function suchmaskeOeffnen(page, { von, bis, nights, airport }){
  const p = new URLSearchParams({
    c24pp_departure_date: von, c24pp_return_date: bis,
    c24pp_travel_duration: nights, c24pp_airport: iata(airport),
    c24pp_adult:'2', c24pp_childrenCount:'0'
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

  /* Falls die Tastatur nicht ankam: Wert direkt setzen und Ereignisse feuern */
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

  /* Weiche Kontrolle: Nach der Auswahl wandert der Wert oft in ein VERSTECKTES Feld –
     deshalb alle Eingabefelder prüfen und notfalls einmal nachtippen, aber NICHT abbrechen. */
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

function budget(t0, schritt){
  if (Date.now() - t0 > 140000) throw new Error('Zeitbudget überschritten bei „'+schritt+'“ – bitte nochmal versuchen (Server war vermutlich kalt).');
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

/* ============ /live-deal: besten Deal LIVE im Rechner finden ============ */
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

    /* Ergebniskarten einsammeln: alle Links mit "statt …€" */
    step='deals-lesen'; budget(t0,step);
    await page.waitForTimeout(2000);
    const karten = page.locator('a').filter({ hasText:/statt\s*[\d.]+\s*€/ });
    const anzahl = Math.min(await karten.count(), 12);
    if (!anzahl) throw new Error('Keine Ergebniskarten mit Preisen gefunden');

    let best = null;
    for (let i = 0; i < anzahl; i++) {
      const text = (await karten.nth(i).innerText().catch(()=> '')) || '';
      const statt = +( (text.match(/statt\s*([\d.]+)\s*€/i)||[])[1]||'' ).replace(/\./g,'');
      const preise = [...text.matchAll(/([\d.]{2,7})\s*€/g)]
        .map(m => +m[1].replace(/\./g,''))
        .filter(p => p >= 100 && p < (statt||99999));
      const preis = preise.length ? Math.min(...preise) : 0;
      if (!statt || !preis) continue;
      const rabatt = Math.round((1 - preis/statt) * 100);
      const zeilen = text.split('\n').map(s=>s.trim()).filter(Boolean);
      const name = zeilen.find(z => !/€|Nächte|inkl\.|p\.P|statt|%/i.test(z) && z.length > 5) || zeilen[0] || 'Hotel';
      const bewertung = (text.match(/(\d,\d)\s*\/\s*6|(\d,\d)/)||[])[1] || '';
      if (!best || rabatt > best.rabatt) best = { i, name, preis, statt, rabatt, bewertung };
    }
    if (!best) throw new Error('Kein Deal mit Streichpreis erkennbar');

    /* Besten Deal öffnen */
    step='deal-oeffnen'; budget(t0,step);
    await karten.nth(best.i).click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle', { timeout:25000 }).catch(()=>{});

    const url = page.url();
    const hotelId = (url.match(/[?&#]hotelId=(\d+)/i)||[])[1]||null;
    await browser.close();
    return res.json({ ok:true, url, hotelId,
      deal:{ hotel:best.name, preis_pp:best.preis, statt_pp:best.statt, rabatt:best.rabatt,
             bewertung:best.bewertung, ort:ziel, von, bis, naechte:+nights, abflughafen:airport } });
  } catch (e) {
    let seite=''; try{ seite=page?page.url():''; }catch(_){}
    if (browser) await browser.close().catch(()=>{});
    return res.status(500).json({ ok:false, step, seite, error:String(e.message||e).slice(0,500) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Link-Roboter v6 läuft auf Port', PORT));
