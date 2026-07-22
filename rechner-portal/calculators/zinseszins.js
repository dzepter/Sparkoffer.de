module.exports = {
  slug: 'zinseszins-rechner',
  title: 'Zinseszins-Rechner',
  teaser: 'Wie ein Startkapital über die Jahre wächst – mit Zinseszins.',
  h1: 'Zinseszins-Rechner – Endkapital nach Jahren berechnen',
  metaTitle: 'Zinseszins-Rechner – Kapitalwachstum online berechnen',
  metaDesc: 'Wie viel wird aus deinem Geld? Zinseszins-Rechner für Startkapital, Zinssatz und Laufzeit – mit Jahresübersicht und Erklärung des Zinseszinseffekts.',
  category: 'finanzen',
  intro: `<p>Der Zinseszinseffekt lässt Vermögen exponentiell wachsen, weil Zinsen selbst
wieder Zinsen bringen. Gib Startkapital, Zinssatz und Anlagedauer ein und sieh, was am
Ende herauskommt.</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="start">Startkapital (€)</label>
    <input id="start" type="number" min="0" step="100" placeholder="z. B. 10000"></div>
  <div class="feld"><label for="zins">Zinssatz / Rendite pro Jahr (%)</label>
    <input id="zins" type="number" min="-20" max="30" step="0.1" placeholder="z. B. 5"></div>
  <div class="feld"><label for="jahre">Laufzeit (Jahre)</label>
    <input id="jahre" type="number" min="1" max="70" step="1" placeholder="z. B. 20"></div>
</div>`,
  script: `
function berechnen(){
  var K=n('start'), p=n('zins'), jahre=n('jahre');
  if(!(K>0)||isNaN(p)||!(jahre>0)) return warten();
  var q=1+p/100, ende=K*Math.pow(q,jahre);
  var zeilen='';
  for(var j=5;j<jahre;j+=5) zeilen+='<tr><td>nach '+j+' Jahren</td><td>'+eur(K*Math.pow(q,j))+'</td></tr>';
  zeigen('<table>'+zeilen+
    '<tr class="summe"><td>Endkapital nach '+Math.round(jahre)+' Jahren</td><td><span class="gross">'+eur(ende)+'</span></td></tr>'+
    '<tr><td>davon Zinsgewinn</td><td>'+eur(ende-K)+'</td></tr>'+
    '<tr><td>Wertzuwachs</td><td>'+fmt((ende/K-1)*100,1)+' %</td></tr></table>'+
    '<p class="hint">Formel: Endkapital = Startkapital × (1 + p/100)<sup>Jahre</sup> – Steuern und Inflation nicht berücksichtigt.</p>');
}`,
  content: `
<h2>Warum der Zinseszins so mächtig ist</h2>
<p>Im ersten Jahr bekommst du Zinsen nur auf dein Startkapital. Ab dem zweiten Jahr
verzinsen sich auch die bereits gutgeschriebenen Zinsen – das Wachstum beschleunigt sich
von Jahr zu Jahr. Bei 7 % Rendite verdoppelt sich ein Kapital etwa alle zehn Jahre; aus
10.000 € werden so in 30 Jahren rund 76.000 €, obwohl „nur“ 7 % pro Jahr anfallen.</p>
<h2>Die 72er-Regel</h2>
<p>Für die schnelle Überschlagsrechnung: <b>72 ÷ Zinssatz ≈ Verdopplungszeit in
Jahren</b>. Bei 4 % dauert die Verdopplung also etwa 18 Jahre, bei 8 % nur 9 Jahre. Die
Regel zeigt auch die Kehrseite: Bei 3 % Inflation halbiert sich die Kaufkraft von Bargeld
in rund 24 Jahren – dazu passt unser <a href="/inflationsrechner/">Inflationsrechner</a>.</p>
<p>Wenn du regelmäßig monatlich einzahlst statt einmalig, nutze den
<a href="/sparplan-rechner/">Sparplan-Rechner</a>.</p>`,
  faq: [
    { q: 'Mit welchem Zinssatz sollte ich rechnen?',
      a: 'Tagesgeld lag zuletzt bei 2–3 %, weltweite Aktien-Indexfonds erzielten historisch langfristig etwa 6–8 % pro Jahr vor Inflation – allerdings mit starken Schwankungen und ohne Garantie für die Zukunft.' },
    { q: 'Werden Steuern berücksichtigt?',
      a: 'Nein. Auf Kapitalerträge fällt in Deutschland Abgeltungsteuer an (25 % plus Soli, ggf. Kirchensteuer), oberhalb des Sparerpauschbetrags von 1.000 € pro Jahr (2.000 € für Paare). Das Endkapital nach Steuern liegt daher niedriger.' },
    { q: 'Was ist der Unterschied zwischen jährlicher und monatlicher Verzinsung?',
      a: 'Bei monatlicher Gutschrift wirkt der Zinseszins etwas stärker: 5 % jährlich entsprechen bei monatlicher Verzinsung effektiv rund 5,12 %. Für Überschlagsrechnungen ist der Unterschied meist vernachlässigbar.' }
  ],
  disclaimer: 'Modellrechnung ohne Gewähr; keine Anlageberatung. Vergangene Renditen sind keine Garantie für zukünftige Entwicklungen.'
};
