module.exports = {
  slug: 'stundenlohn-rechner',
  title: 'Stundenlohn-Rechner',
  teaser: 'Monatsgehalt in Stundenlohn umrechnen – und umgekehrt.',
  h1: 'Stundenlohn-Rechner – Gehalt in Stundenlohn umrechnen',
  metaTitle: 'Stundenlohn-Rechner – Monatsgehalt ⇄ Stundenlohn umrechnen',
  metaDesc: 'Wie viel verdienst du pro Stunde? Rechne Monatsgehalt und Wochenstunden in deinen Stundenlohn um – oder den Stundenlohn in ein Monatsgehalt.',
  category: 'finanzen',
  intro: `<p>Ob für den Jobvergleich oder die Gehaltsverhandlung: Hier rechnest du dein
Monatsgehalt in den Stundenlohn um – oder andersherum einen Stundenlohn in das
entsprechende Monats- und Jahresgehalt.</p>`,
  form: `
<div class="feld"><label for="modus">Was möchtest du berechnen?</label>
  <select id="modus"><option value="std">Stundenlohn aus Monatsgehalt</option>
  <option value="monat">Monatsgehalt aus Stundenlohn</option></select></div>
<div class="zeile">
  <div class="feld"><label for="betrag" id="betragLabel">Monatsgehalt brutto (€)</label>
    <input id="betrag" type="number" min="0" step="50" placeholder="z. B. 3200"></div>
  <div class="feld"><label for="wstd">Wochenarbeitszeit (Stunden)</label>
    <input id="wstd" type="number" min="1" max="60" step="0.5" value="40"></div>
</div>`,
  script: `
function berechnen(){
  var modus=$('modus').value, betrag=n('betrag'), wstd=n('wstd');
  $('betragLabel').textContent = modus==='std' ? 'Monatsgehalt brutto (€)' : 'Stundenlohn brutto (€)';
  if(!(betrag>0)||!(wstd>0)) return warten();
  var mstd=wstd*4.348; // durchschnittliche Wochen pro Monat (52,18 / 12)
  if(modus==='std'){
    var sl=betrag/mstd;
    zeigen('<table><tr><td>Monatliche Arbeitszeit (Ø)</td><td>'+fmt(mstd,1)+' Std.</td></tr>'+
      '<tr class="summe"><td>Stundenlohn</td><td><span class="gross">'+eur(sl)+'</span></td></tr>'+
      '<tr><td>Jahresgehalt (12 Gehälter)</td><td>'+eur(betrag*12)+'</td></tr></table>');
  } else {
    var monat=betrag*mstd;
    zeigen('<table><tr><td>Monatliche Arbeitszeit (Ø)</td><td>'+fmt(mstd,1)+' Std.</td></tr>'+
      '<tr class="summe"><td>Monatsgehalt</td><td><span class="gross">'+eur(monat)+'</span></td></tr>'+
      '<tr><td>Jahresgehalt (12 Gehälter)</td><td>'+eur(monat*12)+'</td></tr></table>');
  }
}`,
  content: `
<h2>So wird gerechnet</h2>
<p>Ein Monat hat im Durchschnitt 4,348 Wochen (52,18 Wochen ÷ 12 Monate). Bei einer
40-Stunden-Woche arbeitest du also rund 174 Stunden pro Monat. Der Stundenlohn ergibt sich
aus <b>Monatsgehalt ÷ (Wochenstunden × 4,348)</b>. Diese Formel verwenden auch Arbeitgeber
und Tarifverträge für die Umrechnung.</p>
<h2>Brutto vergleichen, Netto entscheiden</h2>
<p>Für den Vergleich zweier Jobs ist der Brutto-Stundenlohn die fairste Größe, weil
Steuerklasse und Krankenkasse individuell sind. Was am Ende tatsächlich ankommt, zeigt dir
unser <a href="/brutto-netto-rechner/">Brutto-Netto-Rechner</a>.</p>`,
  faq: [
    { q: 'Wie hoch ist der Mindestlohn?',
      a: 'Der gesetzliche Mindestlohn liegt 2025 bei 12,82 € brutto pro Stunde. Bei einer 40-Stunden-Woche entspricht das etwa 2.230 € brutto im Monat.' },
    { q: 'Warum rechnet man mit 4,348 Wochen pro Monat?',
      a: 'Ein Jahr hat 365,25 Tage, also 52,18 Wochen. Geteilt durch 12 Monate ergibt das 4,348 Wochen pro Monat. Wer einfach mit 4 Wochen rechnet, unterschätzt seine Monatsarbeitszeit um rund 8 %.' },
    { q: 'Zählen Urlaub und Feiertage beim Stundenlohn mit?',
      a: 'Ja. Beim Festgehalt wird der Lohn auch für Urlaubs- und Feiertage gezahlt, die Formel bezieht sich auf die vertragliche Arbeitszeit. Der effektive Lohn pro tatsächlich gearbeiteter Stunde liegt daher sogar etwas höher.' }
  ]
};
