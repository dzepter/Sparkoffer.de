module.exports = {
  slug: 'sparplan-rechner',
  title: 'Sparplan-Rechner',
  teaser: 'Monatlich sparen: Was aus deiner Sparrate über die Jahre wird.',
  h1: 'Sparplan-Rechner – monatliches Sparen mit Zinseszins',
  metaTitle: 'Sparplan-Rechner – Vermögen mit monatlicher Sparrate berechnen',
  metaDesc: 'Was wird aus 50, 100 oder 300 € im Monat? Sparplan-Rechner mit Zinseszins: Endkapital, Einzahlungen und Zinsgewinn auf einen Blick.',
  category: 'finanzen',
  intro: `<p>Ob ETF-Sparplan oder Banksparplan: Hier siehst du, welches Vermögen sich mit
einer monatlichen Sparrate über die Jahre aufbaut – und welcher Anteil davon aus deinen
Einzahlungen stammt und welcher aus Zinsen bzw. Rendite.</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="rate">Monatliche Sparrate (€)</label>
    <input id="rate" type="number" min="1" step="25" placeholder="z. B. 150"></div>
  <div class="feld"><label for="start">Startkapital (€, optional)</label>
    <input id="start" type="number" min="0" step="100" value="0"></div>
  <div class="feld"><label for="zins">Erwartete Rendite pro Jahr (%)</label>
    <input id="zins" type="number" min="-20" max="30" step="0.1" placeholder="z. B. 6"></div>
  <div class="feld"><label for="jahre">Spardauer (Jahre)</label>
    <input id="jahre" type="number" min="1" max="70" step="1" placeholder="z. B. 20"></div>
</div>`,
  script: `
function berechnen(){
  var s=n('rate'), K=n('start')||0, p=n('zins'), jahre=n('jahre');
  if(!(s>0)||isNaN(p)||!(jahre>0)) return warten();
  var m=Math.round(jahre*12), r=p/100/12, ende;
  if(r===0) ende=K+s*m;
  else ende=K*Math.pow(1+r,m)+s*(Math.pow(1+r,m)-1)/r;
  var einzahlungen=K+s*m;
  zeigen('<table>'+
    '<tr class="summe"><td>Endkapital nach '+Math.round(jahre)+' Jahren</td><td><span class="gross">'+eur(ende)+'</span></td></tr>'+
    '<tr><td>Summe der Einzahlungen</td><td>'+eur(einzahlungen)+'</td></tr>'+
    '<tr><td>Zins-/Renditegewinn</td><td>'+eur(ende-einzahlungen)+'</td></tr>'+
    '</table><p class="hint">Nachschüssige monatliche Einzahlung, Steuern und Kosten nicht berücksichtigt.</p>');
}`,
  content: `
<h2>Kleine Raten, große Wirkung</h2>
<p>Beim regelmäßigen Sparen arbeitet die Zeit für dich: 150 € monatlich bei 6 % Rendite
ergeben nach 10 Jahren rund 24.500 € – nach 30 Jahren aber über 146.000 €, obwohl du nur
dreimal so lange eingezahlt hast. Der Grund ist der Zinseszinseffekt, der in den späten
Jahren am stärksten wirkt. Deshalb gilt: Früh anfangen schlägt hohe Raten.</p>
<h2>Realistisch planen</h2>
<ul>
<li><b>Rendite konservativ ansetzen:</b> Für breite Aktien-ETFs rechnen viele langfristig
mit 5–7 % pro Jahr vor Inflation – Schwankungen inklusive.</li>
<li><b>Kosten drücken die Rendite:</b> Schon 1 % laufende Gebühren pro Jahr kosten über
Jahrzehnte fünfstellige Beträge.</li>
<li><b>Inflation bedenken:</b> Das Endkapital ist ein Nominalwert – was es dann noch wert
ist, zeigt der <a href="/inflationsrechner/">Inflationsrechner</a>.</li>
</ul>`,
  faq: [
    { q: 'Was bringt ein Sparplan mit 50 € im Monat?',
      a: 'Bei 6 % Jahresrendite wachsen 50 € monatlich in 20 Jahren auf rund 23.000 € – davon sind 12.000 € eigene Einzahlungen und etwa 11.000 € Renditegewinn.' },
    { q: 'Ist es besser, monatlich zu sparen oder einmalig anzulegen?',
      a: 'Rein rechnerisch schlägt die sofortige Einmalanlage im Schnitt das gestückelte Einzahlen, weil das Geld länger investiert ist. Der Sparplan punktet dafür mit Disziplin und verteiltem Einstiegsrisiko – für monatliches Einkommen ist er ohnehin der natürliche Weg.' },
    { q: 'Berücksichtigt der Rechner die Abgeltungsteuer?',
      a: 'Nein. Gewinne oberhalb des Sparerpauschbetrags (1.000 € pro Person und Jahr) werden mit rund 26 % besteuert; bei Aktienfonds bleiben 30 % der Erträge steuerfrei (Teilfreistellung). Das tatsächliche Endkapital nach Steuern liegt also etwas niedriger.' }
  ],
  disclaimer: 'Modellrechnung ohne Gewähr; keine Anlageberatung. Vergangene Renditen sind keine Garantie für zukünftige Entwicklungen.'
};
