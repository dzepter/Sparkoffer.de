module.exports = {
  slug: 'gehaltserhoehung-rechner',
  title: 'Gehaltserhöhungs-Rechner',
  teaser: 'Wie viel bringt X Prozent mehr Gehalt – und umgekehrt?',
  h1: 'Gehaltserhöhungs-Rechner – Prozent und Euro umrechnen',
  metaTitle: 'Gehaltserhöhung berechnen – Prozent in Euro umrechnen',
  metaDesc: 'Was bedeuten 5 % mehr Gehalt in Euro? Und wie viel Prozent sind 200 € mehr? Der Rechner für deine nächste Gehaltsverhandlung.',
  category: 'finanzen',
  intro: `<p>Vor der Gehaltsverhandlung schnell durchgerechnet: Was bringt eine Erhöhung
um X Prozent in Euro – oder wie viel Prozent entspricht der gewünschte Euro-Betrag?</p>`,
  form: `
<div class="feld"><label for="modus">Was ist bekannt?</label>
  <select id="modus"><option value="prozent">Erhöhung in Prozent → Euro berechnen</option>
  <option value="neu">Neues Gehalt → Prozent berechnen</option></select></div>
<div class="zeile">
  <div class="feld"><label for="alt">Aktuelles Monatsgehalt brutto (€)</label>
    <input id="alt" type="number" min="0" step="50" placeholder="z. B. 3400"></div>
  <div class="feld"><label for="wert" id="wertLabel">Erhöhung (%)</label>
    <input id="wert" type="number" min="0" step="0.5" placeholder="z. B. 5"></div>
</div>`,
  script: `
function berechnen(){
  var modus=$('modus').value, alt=n('alt'), w=n('wert');
  $('wertLabel').textContent = modus==='prozent' ? 'Erhöhung (%)' : 'Neues Monatsgehalt brutto (€)';
  if(!(alt>0)||isNaN(w)) return warten();
  var neu, prozent;
  if(modus==='prozent'){ prozent=w; neu=alt*(1+w/100); }
  else { neu=w; prozent=(neu/alt-1)*100; }
  zeigen('<table>'+
    '<tr><td>Bisheriges Gehalt</td><td>'+eur(alt)+'</td></tr>'+
    '<tr class="summe"><td>Neues Gehalt</td><td><span class="gross">'+eur(neu)+'</span></td></tr>'+
    '<tr><td>Erhöhung</td><td>+'+eur(neu-alt)+' / Monat (+'+fmt(prozent,1)+' %)</td></tr>'+
    '<tr><td>Mehr pro Jahr (12 Gehälter)</td><td>+'+eur((neu-alt)*12)+'</td></tr>'+
    '</table><p class="hint">Bruttowerte – netto kommt wegen der Steuerprogression etwas weniger als der gleiche Prozentsatz an. Prüfe das im <a href="/brutto-netto-rechner/">Brutto-Netto-Rechner</a>.</p>');
}`,
  content: `
<h2>Wie viel Gehaltserhöhung ist üblich?</h2>
<p>Bei regulären Gehaltsrunden gelten <b>3 bis 5 %</b> als typisch, bei erweiterten
Aufgaben oder einer Beförderung sind <b>5 bis 10 %</b> verhandelbar. Den größten Sprung
bringt statistisch der Jobwechsel: Hier sind zweistellige Prozentsätze keine Seltenheit.
Wichtig ist auch der Blick auf die Inflation – eine Erhöhung unterhalb der Teuerungsrate
ist real eine Nullrunde.</p>
<h2>Tipps für die Verhandlung</h2>
<ul>
<li>Mit konkreten Ergebnissen argumentieren (Projekte, Verantwortung, Zahlen) statt mit
gestiegenen Lebenshaltungskosten.</li>
<li>Eine konkrete Zahl nennen und leicht über dem Ziel einsteigen – krumme Werte wie
„7,5 %“ wirken durchdachter als runde.</li>
<li>Alternativen mitdenken: Weiterbildungsbudget, zusätzliche Urlaubstage oder
Jobrad können eine kleinere Erhöhung ausgleichen.</li>
</ul>`,
  faq: [
    { q: 'Kommt eine 5-%-Erhöhung auch netto als 5 % an?',
      a: 'Meist nicht ganz: Durch die Steuerprogression wird der zusätzliche Verdienst mit deinem höchsten (Grenz-)Steuersatz belastet. Von 100 € brutto mehr bleiben je nach Einkommen oft nur 50–65 € netto übrig.' },
    { q: 'Wie oft kann ich nach einer Gehaltserhöhung fragen?',
      a: 'Üblich ist ein Abstand von 12 bis 18 Monaten – oder früher, wenn sich deine Aufgaben deutlich erweitert haben. Ein guter Anlass ist das Jahres- oder Feedbackgespräch.' },
    { q: 'Was ist besser: Einmalzahlung oder prozentuale Erhöhung?',
      a: 'Eine prozentuale Erhöhung wirkt dauerhaft und erhöht die Basis für alle künftigen Erhöhungen, Boni und oft auch die Betriebsrente. Eine Einmalzahlung ist nur einmal Geld – als Dauerlösung ist die Erhöhung fast immer wertvoller.' }
  ]
};
