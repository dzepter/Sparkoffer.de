/* Sparkoffer Link-Roboter  (v3)
   Strategie: Reisesuche mit vorbefüllten Daten öffnen (Zeitraum, Flughafen,
   2 Erwachsene) – dann nur noch Hotelname eintippen, Vorschlag wählen,
   Suche starten, Hotel anklicken, URL zurückgeben.
   Aufruf:  GET /deal-link?hotel=Yalihan+Aspendos&von=2026-07-04&bis=2026-07-11&nights=7&airport=München */

const express = require('express');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const app = express();
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  next();
});

/* Startseite: liefert die Sparkoffer-App direkt mit aus (Desktop-Paket) */
app.get(['/','/app'], (_q, r) => {
  const f = path.join(__dirname, 'sparkoffer-app.html');
  if (fs.existsSync(f)) return r.sendFile(f);
  r.send('Sparkoffer Link-Roboter läuft ✅  – Endpoint: /deal-link');
});

const IATA = { 'frankfurt-hahn':'HHN','frankfurt':'FRA','münchen':'MUC','muenchen':'MUC','berlin':'BER',
  'düsseldorf':'DUS','duesseldorf':'DUS','hamburg':'HAM','stuttgart':'STR','köln':'CGN','koeln':'CGN',
  'hannover':'HAJ','leipzig':'LEJ','nürnberg':'NUE','nuernberg':'NUE','dresden':'DRS','bremen':'BRE',
  'dortmund':'DTM','memmingen':'FMM','karlsruhe':'FKB','saarbrücken':'SCN','münster':'FMO','paderborn':'PAD',
  'friedrichshafen':'FDH','erfurt':'ERF','weeze':'NRN','basel':'BSL','wien':'VIE','zürich':'ZRH','zuerich':'ZRH' };
function iata(name){
  name = (name||'').trim();
  if (/^[A-Z]{3}$/.test(name)) return name;
  const n = name.toLowerCase();
  for (const k in IATA) if (n.includes(k)) return IATA[k];
  return 'FRA';
}
function addDays(iso, d){
  const t = new Date(iso); if (isNaN(t)) return iso;
  t.setDate(t.getDate()+d); return t.toISOString().slice(0,10);
}

/* Nur echte Cookie-/Consent-Elemente entfernen – nichts anderes anfassen */
async function killConsent(page){
  for (const t of ['geht klar','Alle akzeptieren','Akzeptieren','Auswahl bestätigen','Zustimmen','Verstanden']) {
    const b = page.getByRole('button', { name: t }).first();
    if (await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); await page.waitForTimeout(500); return; }
  }
  await page.evaluate(() => {
    document.querySelectorAll('#modal,[role="dialog"],[class*="consent" i],[id*="consent" i],[class*="cookie" i],[id*="cookie" i]').forEach(e => {
      const txt = (e.innerText||'').toLowerCase();
      if (/cookie|zustimm|akzeptier|datenschutz|einwillig/.test(txt)) e.remove();
    });
  }).catch(()=>{});
}

app.get('/deal-link', async (req, res) => {
  const { hotel, von, bis, nights, airport } = req.query;
  if (!hotel) return res.status(400).json({ ok:false, step:'input', error:'Parameter "hotel" fehlt' });

  let browser, page, step = 'start';
  try {
    browser = await chromium.launch({ headless:true, args:['--no-sandbox'] });
    const context = await browser.newContext({
      locale:'de-DE',
      viewport:{ width:1440, height:900 },
      userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
    });
    page = await context.newPage();
    page.setDefaultTimeout(25000);

    /* 1) Reisesuche mit vorbefüllten Daten öffnen (funktioniert nachweislich) */
    step = 'suchmaske';
    const p = new URLSearchParams({
      c24pp_departure_date: von ? addDays(von,-1) : '',
      c24pp_return_date:    bis ? addDays(bis, 7) : '',
      c24pp_travel_duration: nights || '7',
      c24pp_airport: iata(airport),
      c24pp_adult: '2',
      c24pp_childrenCount: '0'
    });
    await page.goto('https://www.check24.net/pauschalreisen-vergleich/?' + p.toString(), { waitUntil:'domcontentloaded' });
    await page.waitForTimeout(2500);
    await killConsent(page);

    /* Falls die Seite in die SPA weiterleitet, dort ankommen lassen */
    await page.waitForLoadState('networkidle', { timeout:20000 }).catch(()=>{});
    await killConsent(page);

    /* 2) Reiseziel-Feld: sichtbares Ziel-Element anklicken, dann ins fokussierte Feld tippen */
    step = 'reiseziel';
    let zielInput = null;
    const direkt = page.getByPlaceholder(/Reiseziel|Wohin|Ziel|Hotel|Region/i).first();
    if (await direkt.isVisible().catch(()=>false)) {
      zielInput = direkt;
      await zielInput.click();
    } else {
      /* SPA-Maske: erste Zeile der Suchbox anklicken, dann erscheint ein Eingabefeld */
      const zeile = page.locator('form, [class*="search" i]').locator('div,button,span')
        .filter({ hasText: /Reiseziel|Wohin|Ziel|Hotel|beliebig/i }).first();
      if (await zeile.isVisible().catch(()=>false)) await zeile.click().catch(()=>{});
      else {
        const irgendeinInput = page.locator('input[type="text"]:not([name="q"]):not([class*="headertop" i])').first();
        await irgendeinInput.click();
      }
      await page.waitForTimeout(600);
      zielInput = page.locator('input:focus').first();
      if (!(await zielInput.isVisible().catch(()=>false)))
        zielInput = page.locator('input[type="text"]:visible:not([name="q"]):not([class*="headertop" i])').first();
    }
    await zielInput.fill('');
    await zielInput.type(hotel, { delay: 60 });
    await page.waitForTimeout(2500);            /* Vorschläge laden lassen */

    /* 3) Vorschlag wählen */
    step = 'vorschlag';
    const wort = hotel.split(' ')[0];
    const sugg = page.locator('li:visible,[role="option"]:visible,[class*="suggest" i] :visible,[class*="autocomplete" i] :visible')
                     .filter({ hasText: new RegExp(wort, 'i') }).first();
    if (await sugg.isVisible().catch(()=>false)) await sugg.click();
    else { await zielInput.press('ArrowDown'); await zielInput.press('Enter'); }
    await page.waitForTimeout(800);

    /* 4) Suche starten */
    step = 'suchen';
    await killConsent(page);
    const suchBtn = page.getByRole('button', { name:/^Suche$|Reise finden|Suchen/i }).first();
    if (await suchBtn.isVisible().catch(()=>false)) await suchBtn.click();
    else await page.keyboard.press('Enter');

    /* 5) Ergebnis abwarten */
    step = 'ergebnisliste';
    await page.waitForURL(/urlaub\.check24\.net\/suche/i, { timeout:45000 });
    await page.waitForLoadState('networkidle', { timeout:40000 }).catch(()=>{});
    await killConsent(page);

    /* 6) Hotel öffnen (falls nicht schon auf der Hotelseite) – neue Tabs abfangen */
    step = 'hotel-oeffnen';
    if (!/hoteldetail|hotelId=/i.test(page.url())) {
      const treffer = page.getByText(new RegExp(hotel.split(' ').slice(0,2).join('.{0,3}'), 'i')).first();
      await treffer.waitFor({ state:'visible', timeout:30000 });
      await treffer.click();
      await page.waitForTimeout(2500);
      const pages = context.pages();
      if (pages.length > 1) page = pages[pages.length-1];
      await page.waitForLoadState('networkidle', { timeout:30000 }).catch(()=>{});
    }

    step = 'url';
    const url = page.url();
    const hotelId = (url.match(/[?&#]hotelId=(\d+)/i) || [])[1] || null;
    await browser.close();
    return res.json({ ok:true, url, hotelId, hotel });
  } catch (e) {
    let seite = '';
    try { seite = page ? page.url() : ''; } catch(_){}
    if (browser) await browser.close().catch(()=>{});
    return res.status(500).json({ ok:false, step, seite, error:String(e.message||e).slice(0,500) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Link-Roboter läuft auf Port', PORT));
