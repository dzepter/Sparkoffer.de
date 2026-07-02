/* Sparkoffer Link-Roboter  (v2)
   Holt die Hotel-Detailseiten-URL von check24.net für einen gefundenen Deal.
   Aufruf:  GET /deal-link?hotel=Yalihan+Aspendos&von=2026-07-04&bis=2026-07-11&nights=7
   Antwort: { ok:true, url:"https://…urlaub.check24.net/…", hotelId:"1234" }        */

const express = require('express');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const app = express();
app.use((req, res, next) => {            // CORS: App darf von überall zugreifen
  res.set('Access-Control-Allow-Origin', '*');
  next();
});

const de = iso => { const [y,m,d] = (iso||'').split('-'); return d?`${d}.${m}.${y}`:''; };

/* Startseite: liefert die Sparkoffer-App direkt mit aus (Desktop-Paket) */
app.get(['/','/app'], (_q, r) => {
  const f = path.join(__dirname, 'sparkoffer-app.html');
  if (fs.existsSync(f)) return r.sendFile(f);
  r.send('Sparkoffer Link-Roboter läuft ✅  – Endpoint: /deal-link');
});

/* Cookie-/Consent-Fenster wegklicken – und notfalls aus der Seite entfernen */
async function killOverlays(page){
  for (const t of ['geht klar','Alle akzeptieren','Akzeptieren','Auswahl bestätigen','Zustimmen','Verstanden','OK']) {
    const b = page.getByRole('button', { name: t }).first();
    if (await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); await page.waitForTimeout(500); }
  }
  await page.keyboard.press('Escape').catch(()=>{});
  await page.evaluate(() => {
    document.querySelectorAll('#modal,.modal,[role="dialog"],[class*="consent" i],[id*="consent" i],[class*="cookie" i],[class*="overlay" i],[class*="backdrop" i]')
      .forEach(e => e.remove());
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
  }).catch(()=>{});
  await page.waitForTimeout(300);
}

/* Reiseziel-Feld finden – ausdrücklich NICHT die Kopfzeilen-Suche (name="q") */
async function findZielFeld(page){
  const kandidaten = [
    page.getByLabel(/Reiseziel/i).first(),
    page.getByPlaceholder(/Reiseziel|Wohin|Ziel oder Hotel|Hotel/i).first(),
    page.locator('input[name*="destination" i],input[id*="destination" i],input[name*="reiseziel" i],input[id*="reiseziel" i],input[name*="travel" i]').first(),
    page.locator('main input[type="text"]:not([name="q"]):not([class*="headertop" i])').first(),
    page.locator('form input[type="text"]:not([name="q"]):not([class*="headertop" i])').first()
  ];
  for (const k of kandidaten) {
    if (await k.isVisible().catch(()=>false)) return k;
  }
  return null;
}

app.get('/deal-link', async (req, res) => {
  const { hotel, von, bis } = req.query;
  if (!hotel) return res.status(400).json({ ok:false, step:'input', error:'Parameter "hotel" fehlt' });

  let browser, page, step = 'start';
  try {
    browser = await chromium.launch({ headless:true, args:['--no-sandbox'] });
    page = await browser.newPage({
      locale:'de-DE',
      viewport:{ width:1440, height:900 },
      userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
    });
    page.setDefaultTimeout(25000);

    step = 'startseite';
    await page.goto('https://www.check24.net/pauschalreisen-vergleich/', { waitUntil:'domcontentloaded' });
    await page.waitForTimeout(1200);

    step = 'cookies';
    await killOverlays(page);

    step = 'reiseziel';
    const ziel = await findZielFeld(page);
    if (!ziel) throw new Error('Reiseziel-Feld nicht gefunden (nur Kopfzeilen-Suche sichtbar)');
    await killOverlays(page);
    await ziel.click();
    await ziel.fill(hotel);
    await page.waitForTimeout(2000);                       // Vorschlagsliste laden lassen

    step = 'vorschlag';
    const sugg = page.locator('li,[role="option"],[class*="suggest" i] li,[class*="suggest" i] a,[class*="autocomplete" i] li')
                     .filter({ hasText: hotel.split(' ')[0] }).first();
    if (await sugg.isVisible().catch(()=>false)) await sugg.click();
    else await ziel.press('Enter');
    await page.waitForTimeout(800);

    step = 'datum';
    await killOverlays(page);
    if (von) {
      const hin = page.locator('input[placeholder*="Hinreise" i],input[name*="depart" i],input[id*="depart" i]').first();
      if (await hin.isVisible().catch(()=>false)) { await hin.fill(de(von)).catch(()=>{}); }
    }
    if (bis) {
      const rueck = page.locator('input[placeholder*="Rückreise" i],input[name*="return" i],input[id*="return" i]').first();
      if (await rueck.isVisible().catch(()=>false)) { await rueck.fill(de(bis)).catch(()=>{}); }
    }

    step = 'suchen';
    await killOverlays(page);
    const suchBtn = page.getByRole('button', { name:/Reise finden|Suche/i }).first();
    if (await suchBtn.isVisible().catch(()=>false)) await suchBtn.click();
    else await page.keyboard.press('Enter');

    step = 'ergebnisliste';
    await page.waitForURL(/urlaub\.check24\.net/, { timeout:40000 });
    await page.waitForLoadState('networkidle', { timeout:40000 }).catch(()=>{});
    await killOverlays(page);

    /* Landet die Suche direkt auf der Hotelseite: fertig. Sonst erstes passendes Hotel anklicken. */
    step = 'hotel-oeffnen';
    if (!/hoteldetail|hotelId=/i.test(page.url())) {
      const treffer = page.getByText(new RegExp(hotel.split(' ').slice(0,2).join('.{0,3}'), 'i')).first();
      await treffer.waitFor({ state:'visible', timeout:30000 });
      await treffer.click();
      await page.waitForLoadState('networkidle', { timeout:30000 }).catch(()=>{});
      await page.waitForTimeout(1500);
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
    return res.status(500).json({ ok:false, step, seite, error:String(e.message||e).slice(0,600) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Link-Roboter läuft auf Port', PORT));
