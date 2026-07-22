module.exports = {
  slug: 'benzinkosten-rechner',
  title: 'Benzinkosten-Rechner',
  teaser: 'Spritkosten pro Fahrt und pro Mitfahrer berechnen.',
  h1: 'Benzinkosten-Rechner – Spritkosten pro Fahrt berechnen',
  metaTitle: 'Benzinkosten-Rechner – Spritkosten für jede Strecke berechnen',
  metaDesc: 'Was kostet die Fahrt? Benzin- und Dieselkosten aus Strecke, Verbrauch und Spritpreis berechnen – auch pro Mitfahrer für Fahrgemeinschaften.',
  category: 'alltag',
  intro: `<p>Vor dem Wochenendtrip oder für die Fahrgemeinschaft: Gib Strecke, Verbrauch
und Spritpreis ein – der Rechner zeigt die Kraftstoffkosten der Fahrt, auf Wunsch geteilt
durch alle Mitfahrenden und für Hin- und Rückfahrt.</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="strecke">Strecke (km, einfach)</label>
    <input id="strecke" type="number" min="1" step="1" placeholder="z. B. 350"></div>
  <div class="feld"><label for="verbrauch">Verbrauch (l/100 km)</label>
    <input id="verbrauch" type="number" min="1" max="30" step="0.1" placeholder="z. B. 6,5"></div>
  <div class="feld"><label for="preis">Spritpreis (€/l)</label>
    <input id="preis" type="number" min="0.5" max="4" step="0.01" placeholder="z. B. 1,75"></div>
  <div class="feld"><label for="personen">Personen im Auto</label>
    <input id="personen" type="number" min="1" max="9" step="1" value="1"></div>
  <div class="feld"><label for="rueck">Hin- und Rückfahrt?</label>
    <select id="rueck"><option value="1">nur Hinfahrt</option><option value="2">hin und zurück</option></select></div>
</div>`,
  script: `
function berechnen(){
  var km=n('strecke'), verbrauch=n('verbrauch'), preis=n('preis');
  var pers=Math.max(1,Math.round(n('personen')||1)), faktor=+$('rueck').value;
  if(!(km>0)||!(verbrauch>0)||!(preis>0)) return warten();
  var gesamtKm=km*faktor, liter=gesamtKm*verbrauch/100, kosten=liter*preis;
  zeigen('<table>'+
    '<tr><td>Gefahrene Strecke</td><td>'+fmt(gesamtKm,0)+' km</td></tr>'+
    '<tr><td>Kraftstoffbedarf</td><td>'+fmt(liter,1)+' l</td></tr>'+
    '<tr class="summe"><td>Spritkosten</td><td><span class="gross">'+eur(kosten)+'</span></td></tr>'+
    (pers>1?'<tr><td>Pro Person ('+pers+')</td><td>'+eur(kosten/pers)+'</td></tr>':'')+
    '<tr><td>Kosten pro 100 km</td><td>'+eur(verbrauch*preis)+'</td></tr>'+
    '</table>');
}`,
  content: `
<h2>Die Rechnung dahinter</h2>
<p><b>Kosten = Strecke ÷ 100 × Verbrauch × Literpreis.</b> Ein Auto mit 6,5 l/100 km
kostet bei 1,75 €/l also rund 11,40 € pro 100 km. Den realen Verbrauch findest du am
zuverlässigsten im Bordcomputer oder per Tankmethode (getankte Liter ÷ gefahrene km ×
100) – er liegt meist 10–20 % über der Herstellerangabe.</p>
<h2>So sparst du an der Zapfsäule</h2>
<ul>
<li><b>Abends tanken:</b> Zwischen 18 und 22 Uhr ist Sprit im Tagesverlauf meist am
günstigsten, morgens am teuersten – Preisunterschiede von 10–15 Cent sind normal.</li>
<li><b>Vorausschauend fahren:</b> 110 statt 140 km/h auf der Autobahn spart schnell
1–2 l/100 km.</li>
<li><b>Ballast und Dachträger runter,</b> Reifendruck prüfen – Kleinigkeiten, die
zusammen 5–10 % ausmachen.</li>
</ul>
<p>Für die vollständige Kostenwahrheit: Mit Wertverlust, Versicherung und Wartung kostet
ein Auto insgesamt meist das Zwei- bis Dreifache der reinen Spritkosten pro Kilometer.</p>`,
  faq: [
    { q: 'Was kostet eine Fahrgemeinschaft pro Person fairerweise?',
      a: 'Verbreitet ist, die reinen Spritkosten durch alle Insassen inklusive Fahrer zu teilen. Wer auch Verschleiß berücksichtigen will, rechnet mit einer Kilometerpauschale von 20–30 Cent und teilt diese.' },
    { q: 'Wie finde ich den realen Verbrauch meines Autos heraus?',
      a: 'Volltanken, Kilometerstand notieren, normal fahren, wieder volltanken: getankte Liter ÷ gefahrene Kilometer × 100 ergibt den echten Durchschnittsverbrauch.' },
    { q: 'Lohnt sich ein Umweg zur billigeren Tankstelle?',
      a: 'Nur bei nennenswerter Ersparnis: 5 km Umweg kosten bei 7 l/100 km selbst schon etwa 60 Cent Sprit plus Zeit. Bei 3 Cent Preisunterschied lohnt sich das erst ab rund 40 Litern Tankmenge – Preis-Apps helfen, Ausreißer direkt an der Route zu finden.' }
  ]
};
