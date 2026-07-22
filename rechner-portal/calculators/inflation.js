module.exports = {
  slug: 'inflationsrechner',
  title: 'Inflationsrechner',
  teaser: 'Was ist dein Geld in X Jahren noch wert? Kaufkraftverlust berechnen.',
  h1: 'Inflationsrechner – Kaufkraftverlust berechnen',
  metaTitle: 'Inflationsrechner – Kaufkraft & Geldwert in der Zukunft berechnen',
  metaDesc: 'Wie viel sind 10.000 € in 10 oder 20 Jahren noch wert? Inflationsrechner: Kaufkraftverlust bei 2, 3 oder frei wählbarer Inflationsrate.',
  category: 'finanzen',
  intro: `<p>Inflation frisst still am Ersparten: Dieser Rechner zeigt, welche Kaufkraft
ein heutiger Geldbetrag nach einer bestimmten Zahl von Jahren noch hat – und welcher
Betrag dann nötig wäre, um sich dasselbe leisten zu können wie heute.</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="betrag">Betrag heute (€)</label>
    <input id="betrag" type="number" min="0" step="100" placeholder="z. B. 10000"></div>
  <div class="feld"><label for="rate">Inflationsrate pro Jahr (%)</label>
    <input id="rate" type="number" min="0" max="25" step="0.1" value="2"></div>
  <div class="feld"><label for="jahre">Zeitraum (Jahre)</label>
    <input id="jahre" type="number" min="1" max="70" step="1" placeholder="z. B. 15"></div>
</div>`,
  script: `
function berechnen(){
  var B=n('betrag'), p=n('rate'), jahre=n('jahre');
  if(!(B>0)||isNaN(p)||!(jahre>0)) return warten();
  var faktor=Math.pow(1+p/100,jahre);
  var kaufkraft=B/faktor, noetig=B*faktor;
  zeigen('<table>'+
    '<tr class="summe"><td>Kaufkraft von '+eur(B)+' in '+Math.round(jahre)+' Jahren</td><td><span class="gross">'+eur(kaufkraft)+'</span></td></tr>'+
    '<tr><td>Kaufkraftverlust</td><td>'+eur(B-kaufkraft)+' ('+fmt((1-1/faktor)*100,1)+' %)</td></tr>'+
    '<tr><td>Benötigt in '+Math.round(jahre)+' Jahren für heutige Kaufkraft</td><td>'+eur(noetig)+'</td></tr>'+
    '</table>');
}`,
  content: `
<h2>Wie Inflation wirkt</h2>
<p>Bei 2 % Inflation – dem Zielwert der Europäischen Zentralbank – verlieren 10.000 € in
20 Jahren rund ein Drittel ihrer Kaufkraft: Sie sind dann real nur noch etwa 6.730 € wert.
Bei 3 % sind es sogar nur noch rund 5.540 €. Das betrifft vor allem Geld, das unverzinst
auf dem Girokonto oder unter dem Kopfkissen liegt.</p>
<h2>Was das für Sparer bedeutet</h2>
<p>Entscheidend ist die <b>Realrendite</b>: Verzinsung minus Inflation. Ein Tagesgeldkonto
mit 2 % Zinsen bei 2,5 % Inflation verliert real an Wert – trotz nominaler Zinsen. Wer
Kaufkraft erhalten oder aufbauen will, braucht langfristig Anlagen, deren Rendite über der
Inflationsrate liegt. Wie sich Renditen langfristig auswirken, zeigt der
<a href="/zinseszins-rechner/">Zinseszins-Rechner</a>.</p>`,
  faq: [
    { q: 'Wie hoch ist die Inflation in Deutschland normalerweise?',
      a: 'Langfristig lag die Inflationsrate in Deutschland meist zwischen 1 und 3 % pro Jahr. Ausnahmejahre wie 2022/2023 mit 6–8 % zeigen aber, dass auch deutlich höhere Raten möglich sind. Die EZB strebt mittelfristig 2 % an.' },
    { q: 'Womit wird die Inflationsrate gemessen?',
      a: 'Mit dem Verbraucherpreisindex des Statistischen Bundesamts: Er verfolgt die Preise eines repräsentativen Warenkorbs aus Miete, Energie, Lebensmitteln, Dienstleistungen und mehr. Deine persönliche Inflationsrate kann davon abweichen – je nachdem, wofür du dein Geld ausgibst.' },
    { q: 'Sind 2 % Inflation nicht harmlos?',
      a: 'Pro Jahr ja, über Jahrzehnte nicht: Bei konstant 2 % halbiert sich die Kaufkraft in etwa 35 Jahren. Für Altersvorsorge über 30 oder 40 Jahre ist die Inflation deshalb ein entscheidender Faktor.' }
  ]
};
