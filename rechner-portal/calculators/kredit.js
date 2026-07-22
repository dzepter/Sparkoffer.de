module.exports = {
  slug: 'kreditrechner',
  title: 'Kreditrechner',
  teaser: 'Monatsrate, Zinskosten und Gesamtkosten eines Kredits.',
  h1: 'Kreditrechner – Monatsrate und Zinskosten berechnen',
  metaTitle: 'Kreditrechner – Monatsrate & Gesamtkosten online berechnen',
  metaDesc: 'Was kostet dein Kredit wirklich? Berechne Monatsrate, Zinskosten und Gesamtaufwand für Ratenkredite – kostenlos und ohne Anmeldung.',
  category: 'finanzen',
  intro: `<p>Gib Kreditsumme, Zinssatz und Laufzeit ein – der Rechner zeigt dir die
monatliche Rate, die gesamten Zinskosten und was du am Ende insgesamt zurückzahlst
(Annuitätendarlehen, wie bei Ratenkrediten üblich).</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="summe">Kreditsumme (€)</label>
    <input id="summe" type="number" min="0" step="500" placeholder="z. B. 15000"></div>
  <div class="feld"><label for="zins">Effektiver Jahreszins (%)</label>
    <input id="zins" type="number" min="0" max="30" step="0.01" placeholder="z. B. 6,5"></div>
  <div class="feld"><label for="jahre">Laufzeit (Jahre)</label>
    <input id="jahre" type="number" min="0.5" max="40" step="0.5" placeholder="z. B. 5"></div>
</div>`,
  script: `
function berechnen(){
  var P=n('summe'), zins=n('zins'), jahre=n('jahre');
  if(!(P>0)||isNaN(zins)||!(jahre>0)) return warten();
  var m=Math.round(jahre*12), r=zins/100/12, rate;
  if(r===0) rate=P/m;
  else rate=P*r/(1-Math.pow(1+r,-m));
  var gesamt=rate*m, zinsen=gesamt-P;
  zeigen('<table>'+
    '<tr class="summe"><td>Monatliche Rate</td><td><span class="gross">'+eur(rate)+'</span></td></tr>'+
    '<tr><td>Anzahl Raten</td><td>'+m+'</td></tr>'+
    '<tr><td>Zinskosten gesamt</td><td>'+eur(zinsen)+'</td></tr>'+
    '<tr><td>Gesamtrückzahlung</td><td>'+eur(gesamt)+'</td></tr>'+
    '</table>');
}`,
  content: `
<h2>Wie die Monatsrate berechnet wird</h2>
<p>Ratenkredite sind Annuitätendarlehen: Die Rate bleibt jeden Monat gleich, aber ihre
Zusammensetzung ändert sich. Anfangs steckt viel Zins und wenig Tilgung in der Rate, zum
Ende hin dreht sich das Verhältnis um. Die Formel lautet
<b>Rate = Kreditsumme × i ÷ (1 − (1 + i)<sup>−n</sup>)</b>, mit i = Monatszins und
n = Anzahl der Monatsraten.</p>
<h2>Worauf du beim Kreditvergleich achten solltest</h2>
<ul>
<li><b>Effektiver Jahreszins</b> statt Sollzins vergleichen – nur er enthält alle Kosten.</li>
<li><b>„Bis zu“-Zinsen ignorieren:</b> Beworbene Top-Zinsen bekommen nur die besten
Bonitäten. Entscheidend ist der Zwei-Drittel-Zins in der Werbung (den zwei Drittel der
Kunden tatsächlich erhalten).</li>
<li><b>Kurze Laufzeit spart Geld:</b> Doppelte Laufzeit heißt grob doppelte Zinskosten –
wähle die kürzeste Laufzeit, deren Rate du sicher tragen kannst.</li>
<li><b>Kostenlose Sondertilgung</b> vereinbaren, um bei Geldsegen früher rauszukommen.</li>
</ul>`,
  faq: [
    { q: 'Was ist der Unterschied zwischen Sollzins und effektivem Jahreszins?',
      a: 'Der Sollzins ist der reine Zinssatz auf die Kreditsumme. Der effektive Jahreszins rechnet zusätzlich Kosten und die Verrechnungsweise ein und ist deshalb die einzig richtige Vergleichszahl – Banken müssen ihn angeben.' },
    { q: 'Kann ich einen Ratenkredit vorzeitig zurückzahlen?',
      a: 'Ja, Verbraucherkredite dürfen jederzeit ganz oder teilweise zurückgezahlt werden. Die Bank darf dafür maximal 1 % der Restschuld als Vorfälligkeitsentschädigung verlangen (0,5 % bei weniger als einem Jahr Restlaufzeit).' },
    { q: 'Wie viel Rate kann ich mir leisten?',
      a: 'Eine verbreitete Faustregel: Alle Kreditraten zusammen sollten 30–40 % des Nettoeinkommens nicht übersteigen – und ein Puffer für Unvorhergesehenes sollte auch nach der Rate übrig bleiben.' }
  ],
  disclaimer: 'Modellrechnung ohne Gewähr. Tatsächliche Konditionen hängen von Bonität und Anbieter ab; dies ist keine Anlage- oder Kreditberatung.'
};
