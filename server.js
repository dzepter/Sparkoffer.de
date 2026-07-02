/* Sparkoffer Link-Roboter
   Holt die Hotel-Detailseiten-URL von check24.net für einen gefundenen Deal.
   Aufruf:  GET /deal-link?hotel=Yalihan+Aspendos&von=2026-07-04&bis=2026-07-11&nights=7
   Antwort: { ok:true, url:"https://…urlaub.check24.net/…", hotelId:"1234" }        */

const express = require('express');
const { chromium } = require('playwright');

const app = express();
app.use((req, res, next) => {            // CORS: App darf von überall zugreifen
  res.set('Access-Control-Allow-Origin', '*');
  next();
});

const de = iso => { const [y,m,d] = (iso||'').split('-'); return d?`${d}.${m}.${y}`:''; };

app.get('/', (_q, r) => r.send('Sparkoffer Link-Roboter läuft ✅  – Endpoint: /deal-link'));

app.get('/deal-link', async (req, res) => {
  const { hotel, von, bis, nights } = req.query;
  if (!hotel) return res.status(400).json({ ok:false, step:'input', error:'Parameter "hotel" fehlt' });

  let browser, step = 'start';
  try {
    browser = await chromium.launch({ headless:true, args:['--no-sandbox'] });
    const page = await browser.newPage({
      locale:'de-DE',
      userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
    });
    page.setDefaultTimeout(25000);

    step = 'startseite';
    await page.goto('https://www.check24.net/pauschalreisen-vergleich/', { waitUntil:'domcontentloaded' });

    step = 'cookies';
    for (const t of ['geht klar','Alle akzeptieren','Akzeptieren','Zustimmen']) {
      const b = page.getByRole('button', { name:t }).first();
      if (await b.isVisible().catch(()=>false)) { await b.click().catch(()=>{}); break; }
    }

    step = 'reiseziel';
    const ziel = page.locator([
      'input[name*="destination" i]','input[id*="destination" i]',
      'input[placeholder*="Reiseziel" i]','input[placeholder*="Ziel" i]',
      'form input[type="text"]'
    ].join(',')).first();
    await ziel.waitFor({ state:'visible' });
    await ziel.click();
    await ziel.fill(hotel);
    await page.waitForTimeout(1800);                       // Vorschlagsliste laden lassen
    step = 'vorschlag';
    const sugg = page.locator('li,[role="option"],[class*="suggest" i] a,[class*="autocomplete" i] li')
                     .filter({ hasText: hotel.split(' ')[0] }).first();
    if (await sugg.isVisible().catch(()=>false)) await sugg.click();
    else await ziel.press('Enter');

    step = 'datum';
    if (von) {
      const hin = page.locator('input[placeholder*="Hinreise" i],input[name*="depart" i],input[id*="depart" i]').first();
      if (await hin.isVisible().catch(()=>false)) { await hin.fill(de(von)); }
    }
    if (bis) {
      const rueck = page.locator('input[placeholder*="Rückreise" i],input[name*="return" i],input[id*="return" i]').first();
      if (await rueck.isVisible().catch(()=>false)) { await rueck.fill(de(bis)); }
    }

    step = 'suchen';
    const suchBtn = page.getByRole('button', { name:/Reise finden|Suche/i }).first();
    if (await suchBtn.isVisible().catch(()=>false)) await suchBtn.click();
    else await page.keyboard.press('Enter');

    step = 'ergebnisliste';
    await page.waitForURL(/urlaub\.check24\.net/, { timeout:35000 });
    await page.waitForLoadState('networkidle', { timeout:35000 }).catch(()=>{});

    /* Wenn die Suche direkt auf der Hotelseite landet: fertig. Sonst erstes passendes Hotel anklicken. */
    step = 'hotel-oeffnen';
    if (!/hoteldetail|hotelId=/i.test(page.url())) {
      const treffer = page.getByText(new RegExp(hotel.split(' ').slice(0,2).join('.{0,3}'), 'i')).first();
      await treffer.waitFor({ state:'visible', timeout:25000 });
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
    if (browser) await browser.close().catch(()=>{});
    return res.status(500).json({ ok:false, step, error:String(e.message||e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Link-Roboter läuft auf Port', PORT));
