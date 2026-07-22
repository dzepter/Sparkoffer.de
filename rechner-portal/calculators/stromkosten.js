module.exports = {
  slug: 'stromkosten-rechner',
  title: 'Stromkosten-Rechner',
  teaser: 'Was kostet ein Gerät pro Tag, Monat und Jahr an Strom?',
  h1: 'Stromkosten-Rechner – was kostet ein Gerät im Jahr?',
  metaTitle: 'Stromkosten-Rechner – Stromverbrauch von Geräten berechnen',
  metaDesc: 'Was kostet dein Kühlschrank, Gaming-PC oder Heizlüfter an Strom? Berechne die Kosten pro Tag, Monat und Jahr aus Watt, Laufzeit und Strompreis.',
  category: 'alltag',
  intro: `<p>Heizlüfter, Gaming-PC, alter Kühlschrank: Gib die Leistung eines Geräts, die
tägliche Nutzungsdauer und deinen Strompreis ein – du siehst sofort, was das Gerät pro
Tag, Monat und Jahr kostet.</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="watt">Leistung des Geräts (Watt)</label>
    <input id="watt" type="number" min="0.1" step="1" placeholder="z. B. 2000"></div>
  <div class="feld"><label for="stunden">Nutzung pro Tag (Stunden)</label>
    <input id="stunden" type="number" min="0.1" max="24" step="0.1" placeholder="z. B. 3"></div>
  <div class="feld"><label for="preis">Strompreis (Cent/kWh)</label>
    <input id="preis" type="number" min="5" max="80" step="0.1" value="35"></div>
</div>`,
  script: `
function berechnen(){
  var watt=n('watt'), std=n('stunden'), cent=n('preis');
  if(!(watt>0)||!(std>0)||!(cent>0)) return warten();
  var kwhTag=watt*std/1000, tag=kwhTag*cent/100;
  zeigen('<table>'+
    '<tr><td>Verbrauch pro Tag</td><td>'+fmt(kwhTag,2)+' kWh</td></tr>'+
    '<tr><td>Kosten pro Tag</td><td>'+eur(tag)+'</td></tr>'+
    '<tr><td>Kosten pro Monat</td><td>'+eur(tag*30.44)+'</td></tr>'+
    '<tr class="summe"><td>Kosten pro Jahr</td><td><span class="gross">'+eur(tag*365.25)+'</span></td></tr>'+
    '<tr><td>Verbrauch pro Jahr</td><td>'+fmt(kwhTag*365.25,0)+' kWh</td></tr>'+
    '</table>');
}`,
  content: `
<h2>So rechnest du Watt in Euro um</h2>
<p><b>Watt × Stunden ÷ 1000 = Kilowattstunden (kWh)</b>; multipliziert mit deinem
Strompreis ergibt das die Kosten. Ein 2.000-Watt-Heizlüfter, der 3 Stunden läuft,
verbraucht 6 kWh – bei 35 Cent/kWh also 2,10 € pro Tag oder rund 64 € im Monat. Die
Leistungsaufnahme steht auf dem Typenschild; genauer misst ein Zwischenstecker-Messgerät
(ab ca. 10 €), das auch Standby-Verbrauch sichtbar macht.</p>
<h2>Die üblichen Stromfresser</h2>
<ul>
<li><b>Heizgeräte</b> (Heizlüfter, Durchlauferhitzer, Wäschetrockner): alles, was Wärme
erzeugt, zieht 1.000–3.000 W.</li>
<li><b>Alte Kühl- und Gefriergeräte:</b> laufen rund um die Uhr – ein 15 Jahre altes
Gerät kostet oft 100 € mehr pro Jahr als ein effizientes neues.</li>
<li><b>Standby:</b> 5–10 W dauerhaft ergeben 15–30 € pro Jahr und Gerät – abschaltbare
Steckdosenleisten helfen.</li>
</ul>`,
  faq: [
    { q: 'Was kostet eine Kilowattstunde Strom?',
      a: 'In Deutschland zahlen Haushalte zuletzt je nach Tarif meist 25–40 Cent pro kWh. Den exakten Preis findest du auf deiner Stromrechnung – er lohnt sich als Eingabe für realistische Ergebnisse.' },
    { q: 'Wie viel Strom verbraucht ein Haushalt im Jahr?',
      a: 'Als Richtwert: Eine Person rund 1.500 kWh, zwei Personen etwa 2.500 kWh, eine vierköpfige Familie 3.500–4.500 kWh pro Jahr – mit elektrischer Warmwasserbereitung jeweils deutlich mehr.' },
    { q: 'Lohnt sich der Austausch alter Geräte?',
      a: 'Bei Dauerläufern wie Kühlschrank oder Gefriertruhe oft ja: Spart ein Neugerät 150 kWh pro Jahr, sind das gut 50 € jährlich – über 10–15 Jahre Lebensdauer mehr als der halbe Kaufpreis.' }
  ]
};
