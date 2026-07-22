module.exports = {
  slug: 'mehrwertsteuer-rechner',
  title: 'Mehrwertsteuer-Rechner',
  teaser: 'Netto ⇄ Brutto mit 19 % oder 7 % – inkl. Steueranteil.',
  h1: 'Mehrwertsteuer-Rechner – 19 % und 7 % MwSt berechnen',
  metaTitle: 'Mehrwertsteuer-Rechner – MwSt (19 % / 7 %) berechnen',
  metaDesc: 'MwSt schnell berechnen: Netto zu Brutto oder Brutto zu Netto mit 19 % oder 7 % Mehrwertsteuer. Kostenlos, mit Rechenweg.',
  category: 'finanzen',
  intro: `<p>Rechnungen schreiben oder prüfen: Dieser Rechner ermittelt aus einem Netto-
oder Bruttobetrag den jeweils anderen Wert und weist die enthaltene Mehrwertsteuer
(19 % Regelsatz oder 7 % ermäßigt) aus.</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="betrag">Betrag (€)</label>
    <input id="betrag" type="number" min="0" step="0.01" placeholder="z. B. 100"></div>
  <div class="feld"><label for="richtung">Der Betrag ist …</label>
    <select id="richtung"><option value="netto">netto (ohne MwSt) → Brutto berechnen</option>
    <option value="brutto">brutto (mit MwSt) → Netto berechnen</option></select></div>
  <div class="feld"><label for="satz">Steuersatz</label>
    <select id="satz"><option value="19">19 % (Regelsatz)</option><option value="7">7 % (ermäßigt)</option></select></div>
</div>`,
  script: `
function berechnen(){
  var b=n('betrag'), satz=n('satz'), richtung=$('richtung').value;
  if(!(b>0)) return warten();
  var netto, brutto;
  if(richtung==='netto'){ netto=b; brutto=b*(1+satz/100); }
  else { brutto=b; netto=b/(1+satz/100); }
  zeigen('<table><tr><td>Nettobetrag</td><td>'+eur(netto)+'</td></tr>'+
    '<tr><td>Mehrwertsteuer ('+satz+' %)</td><td>'+eur(brutto-netto)+'</td></tr>'+
    '<tr class="summe"><td>Bruttobetrag</td><td><span class="gross">'+eur(brutto)+'</span></td></tr></table>');
}`,
  content: `
<h2>Die Formeln</h2>
<ul>
<li><b>Netto → Brutto:</b> Netto × 1,19 (bzw. × 1,07)</li>
<li><b>Brutto → Netto:</b> Brutto ÷ 1,19 (bzw. ÷ 1,07)</li>
</ul>
<p>Ein häufiger Fehler: Wer aus einem Bruttobetrag die Steuer herausrechnen will, darf
nicht einfach 19 % abziehen. In 119 € brutto stecken 100 € netto und 19 € Steuer – der
Steueranteil am Brutto beträgt also nur rund 15,97 %, nicht 19 %.</p>
<h2>Wann gelten 19 %, wann 7 %?</h2>
<p>Der Regelsatz von 19 % gilt für die meisten Waren und Dienstleistungen. Der ermäßigte
Satz von 7 % gilt u. a. für Grundnahrungsmittel, Bücher und Zeitungen, den öffentlichen
Nahverkehr und Hotelübernachtungen. Manche Produkte sind Grenzfälle – maßgeblich ist die
Anlage 2 zum Umsatzsteuergesetz.</p>`,
  faq: [
    { q: 'Ist Mehrwertsteuer dasselbe wie Umsatzsteuer?',
      a: 'Im Alltag ja: „Mehrwertsteuer“ ist der umgangssprachliche Begriff, das Gesetz spricht von Umsatzsteuer. Auf Rechnungen sind beide Bezeichnungen üblich und meinen dieselbe Steuer.' },
    { q: 'Wie rechne ich 19 % aus einem Bruttopreis heraus?',
      a: 'Bruttobetrag durch 1,19 teilen ergibt den Nettobetrag; die Differenz ist die enthaltene Steuer. Beispiel: 238 € ÷ 1,19 = 200 € netto, also 38 € MwSt.' },
    { q: 'Wer muss keine Umsatzsteuer ausweisen?',
      a: 'Kleinunternehmer nach § 19 UStG (Vorjahresumsatz bis 25.000 €, Stand 2025) dürfen Rechnungen ohne Umsatzsteuer stellen, können dann aber auch keine Vorsteuer abziehen.' }
  ]
};
