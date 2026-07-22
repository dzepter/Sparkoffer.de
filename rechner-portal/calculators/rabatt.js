module.exports = {
  slug: 'rabatt-rechner',
  title: 'Rabatt-Rechner',
  teaser: 'Endpreis und Ersparnis bei Prozent-Rabatten berechnen.',
  h1: 'Rabatt-Rechner – Endpreis nach Rabatt berechnen',
  metaTitle: 'Rabatt-Rechner – Preis nach Rabatt & Ersparnis berechnen',
  metaDesc: 'Wie viel kostet es nach 20 % Rabatt? Rabattrechner für Sale und Schlussverkauf: Endpreis, Ersparnis und Kombination mehrerer Rabatte.',
  category: 'finanzen',
  intro: `<p>Sale, Gutschein, Schlussverkauf: Gib den Originalpreis und den Rabatt ein –
du siehst sofort den Endpreis und deine Ersparnis. Auch ein zweiter Zusatzrabatt
(„20 % + nochmal 10 %“) lässt sich einrechnen.</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="preis">Originalpreis (€)</label>
    <input id="preis" type="number" min="0" step="0.01" placeholder="z. B. 89,99"></div>
  <div class="feld"><label for="rab1">Rabatt (%)</label>
    <input id="rab1" type="number" min="0" max="100" step="1" placeholder="z. B. 20"></div>
  <div class="feld"><label for="rab2">Zusatzrabatt (%, optional)</label>
    <input id="rab2" type="number" min="0" max="100" step="1" value="0"></div>
</div>`,
  script: `
function berechnen(){
  var p=n('preis'), r1=n('rab1'), r2=n('rab2')||0;
  if(!(p>0)||isNaN(r1)) return warten();
  var nach1=p*(1-r1/100), ende=nach1*(1-r2/100);
  var gesamtRabatt=(1-ende/p)*100;
  zeigen('<table>'+
    (r2>0?'<tr><td>Nach '+fmt(r1,0)+' % Rabatt</td><td>'+eur(nach1)+'</td></tr>':'')+
    '<tr class="summe"><td>Endpreis</td><td><span class="gross">'+eur(ende)+'</span></td></tr>'+
    '<tr><td>Du sparst</td><td>'+eur(p-ende)+' ('+fmt(gesamtRabatt,1)+' %)</td></tr>'+
    '</table>'+(r2>0?'<p class="hint">Hinweis: '+fmt(r1,0)+' % + '+fmt(r2,0)+' % sind zusammen '+fmt(gesamtRabatt,1)+' % – nicht '+fmt(r1+r2,0)+' %, weil der zweite Rabatt vom bereits reduzierten Preis abgeht.</p>':''));
}`,
  content: `
<h2>Rabatte richtig rechnen</h2>
<p>Der Endpreis ergibt sich aus <b>Originalpreis × (1 − Rabatt ÷ 100)</b>. Bei 20 %
Rabatt zahlst du also 80 % des Preises. Werden mehrere Rabatte kombiniert, multiplizieren
sich die Faktoren: „20 % + 10 %“ ergibt 0,8 × 0,9 = 0,72 – zusammen also 28 % Rabatt,
nicht 30 %. Händler nutzen diesen Effekt gern in der Werbung.</p>
<h2>Ist der Rabatt wirklich ein Schnäppchen?</h2>
<p>Durchgestrichene Preise beziehen sich oft auf die unverbindliche Preisempfehlung, die
im Handel selten verlangt wird. Ein „50 % reduziert“-Schild sagt deshalb wenig darüber,
ob der Endpreis gut ist – ein kurzer Preisvergleich beim üblichen Marktpreis lohnt fast
immer. Seit 2022 müssen Händler bei Rabatten zusätzlich den niedrigsten Preis der letzten
30 Tage angeben.</p>`,
  faq: [
    { q: 'Wie rechne ich 30 % Rabatt schnell im Kopf aus?',
      a: 'Erst 10 % nehmen (Komma um eine Stelle verschieben) und mal 3: Bei 89,99 € sind 10 % rund 9 €, also 27 € Rabatt – Endpreis etwa 63 €.' },
    { q: 'Was bedeutet „bis zu 70 % reduziert“?',
      a: 'Nur einzelne Artikel erreichen den Maximalrabatt, der Großteil ist meist deutlich schwächer reduziert. Der Rabatt auf das Wunschprodukt zählt, nicht die Plakatzahl.' },
    { q: 'Sind zwei Rabatte hintereinander schlechter als ihre Summe?',
      a: 'Ja, immer: Der zweite Rabatt wird vom schon reduzierten Preis berechnet. 25 % + 25 % ergeben zusammen 43,75 % – spürbar weniger als 50 %.' }
  ]
};
