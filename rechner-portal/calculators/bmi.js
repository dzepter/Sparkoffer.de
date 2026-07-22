module.exports = {
  slug: 'bmi-rechner',
  title: 'BMI-Rechner',
  teaser: 'Body-Mass-Index aus Größe und Gewicht – mit WHO-Einordnung.',
  h1: 'BMI-Rechner – Body-Mass-Index berechnen',
  metaTitle: 'BMI-Rechner – Body-Mass-Index kostenlos berechnen',
  metaDesc: 'Berechne deinen BMI aus Größe und Gewicht und sieh sofort die Einordnung nach WHO: Untergewicht, Normalgewicht, Übergewicht oder Adipositas.',
  category: 'gesundheit',
  intro: `<p>Der Body-Mass-Index (BMI) setzt dein Gewicht ins Verhältnis zu deiner
Körpergröße und liefert eine erste Orientierung, ob dein Gewicht im Normalbereich liegt.
Gib einfach Größe und Gewicht ein.</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="groesse">Körpergröße (cm)</label>
    <input id="groesse" type="number" min="80" max="250" step="1" placeholder="z. B. 175"></div>
  <div class="feld"><label for="gewicht">Gewicht (kg)</label>
    <input id="gewicht" type="number" min="20" max="350" step="0.1" placeholder="z. B. 72"></div>
</div>`,
  script: `
function berechnen(){
  var g=n('groesse'), kg=n('gewicht');
  if(!(g>50)||!(kg>10)) return warten();
  var m=g/100, bmi=kg/(m*m);
  var kat, farbe;
  if(bmi<18.5){kat='Untergewicht';farbe='var(--rot)';}
  else if(bmi<25){kat='Normalgewicht';farbe='var(--gruen)';}
  else if(bmi<30){kat='Übergewicht (Präadipositas)';farbe='#b07d00';}
  else if(bmi<35){kat='Adipositas Grad I';farbe='var(--rot)';}
  else if(bmi<40){kat='Adipositas Grad II';farbe='var(--rot)';}
  else {kat='Adipositas Grad III';farbe='var(--rot)';}
  var von=(18.5*m*m), bis=(24.9*m*m);
  zeigen('<p>Dein BMI:</p><p class="gross">'+fmt(bmi,1)+'</p>'+
    '<p style="font-weight:700;color:'+farbe+'">'+kat+'</p>'+
    '<p class="hint">Normalgewicht läge bei deiner Größe zwischen '+fmt(von,0)+' und '+fmt(bis,0)+' kg (BMI 18,5–24,9, WHO-Klassifikation für Erwachsene).</p>');
}`,
  content: `
<h2>So wird der BMI berechnet</h2>
<p>Die Formel lautet <b>BMI = Gewicht in kg ÷ (Größe in m)²</b>. Ein 1,75 m großer Mensch
mit 72 kg hat also einen BMI von 72 ÷ 3,06 ≈ 23,5. Die WHO ordnet Werte für Erwachsene so
ein: unter 18,5 Untergewicht, 18,5–24,9 Normalgewicht, 25–29,9 Übergewicht, ab 30
Adipositas.</p>
<h2>Was der BMI kann – und was nicht</h2>
<p>Der BMI ist ein grober Bevölkerungs-Maßstab. Er unterscheidet nicht zwischen Muskel-
und Fettmasse: Kraftsportler landen schnell im „Übergewicht“, obwohl ihr Körperfettanteil
niedrig ist. Auch Alter, Geschlecht und Fettverteilung spielen eine Rolle – Bauchfett ist
gesundheitlich relevanter als Hüftfett, weshalb Ärzte zusätzlich den Taillenumfang
betrachten. Für Kinder und Jugendliche gelten eigene Referenzwerte (Perzentilen).</p>`,
  faq: [
    { q: 'Welcher BMI ist ideal?',
      a: 'Für Erwachsene gilt 18,5 bis 24,9 als Normalbereich. Studien deuten darauf hin, dass mit zunehmendem Alter auch leicht höhere Werte unproblematisch sein können – entscheidend sind Gesamtgesundheit, Fitness und Fettverteilung.' },
    { q: 'Gilt der BMI auch für Sportler?',
      a: 'Nur eingeschränkt: Muskeln sind schwerer als Fett, daher überschätzt der BMI bei muskulösen Menschen das „Übergewicht“. Aussagekräftiger sind dann Körperfettmessung oder Taillenumfang.' },
    { q: 'Ab wann spricht man von Adipositas?',
      a: 'Ab einem BMI von 30. Adipositas gilt als chronische Erkrankung und erhöht das Risiko für Diabetes, Herz-Kreislauf-Erkrankungen und Gelenkprobleme – eine ärztliche Begleitung beim Abnehmen ist dann sinnvoll.' }
  ],
  disclaimer: 'Der BMI ist ein Orientierungswert und ersetzt keine ärztliche Beurteilung.'
};
