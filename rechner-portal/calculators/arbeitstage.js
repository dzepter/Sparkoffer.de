module.exports = {
  slug: 'arbeitstage-rechner',
  title: 'Arbeitstage-Rechner',
  teaser: 'Arbeitstage zwischen zwei Daten – abzüglich Feiertage & Urlaub.',
  h1: 'Arbeitstage-Rechner – Arbeitstage in einem Zeitraum zählen',
  metaTitle: 'Arbeitstage-Rechner – Arbeitstage zwischen zwei Daten berechnen',
  metaDesc: 'Wie viele Arbeitstage hat der Zeitraum? Zähle Montag bis Freitag zwischen zwei Daten und ziehe Feiertage und Urlaubstage ab – z. B. für Projekte oder Steuer.',
  category: 'alltag',
  intro: `<p>Für Projektplanung, Steuererklärung (Pendlerpauschale) oder Elternzeit: Der
Rechner zählt die Arbeitstage (Montag bis Freitag) zwischen zwei Daten. Feiertage und
eigene Urlaubstage ziehst du einfach als Zahl ab – sie unterscheiden sich je nach
Bundesland.</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="von">Von (einschließlich)</label><input id="von" type="date"></div>
  <div class="feld"><label for="bis">Bis (einschließlich)</label><input id="bis" type="date"></div>
  <div class="feld"><label for="feiertage">Feiertage im Zeitraum (auf Mo–Fr)</label>
    <input id="feiertage" type="number" min="0" max="60" step="1" value="0"></div>
  <div class="feld"><label for="urlaub">Eigene Urlaubs-/Kranktage</label>
    <input id="urlaub" type="number" min="0" max="200" step="1" value="0"></div>
</div>`,
  script: `
function berechnen(){
  var v=$('von').value, b=$('bis').value;
  if(!v||!b) return warten();
  var d1=new Date(v+'T00:00:00'), d2=new Date(b+'T00:00:00');
  if(isNaN(d1)||isNaN(d2)||d2<d1) return warten();
  var werktage=0, d=new Date(d1);
  while(d<=d2){ var wt=d.getDay(); if(wt!==0&&wt!==6) werktage++; d.setDate(d.getDate()+1); }
  var feiertage=Math.round(n('feiertage')||0), urlaub=Math.round(n('urlaub')||0);
  var arbeitstage=Math.max(0,werktage-feiertage-urlaub);
  var kalendertage=Math.round((d2-d1)/86400000)+1;
  zeigen('<table>'+
    '<tr><td>Kalendertage</td><td>'+kalendertage+'</td></tr>'+
    '<tr><td>Montag–Freitag</td><td>'+werktage+'</td></tr>'+
    (feiertage?'<tr><td>abzgl. Feiertage</td><td>−'+feiertage+'</td></tr>':'')+
    (urlaub?'<tr><td>abzgl. Urlaub/Krankheit</td><td>−'+urlaub+'</td></tr>':'')+
    '<tr class="summe"><td>Arbeitstage</td><td><span class="gross">'+arbeitstage+'</span></td></tr>'+
    '</table>');
}`,
  content: `
<h2>Wie viele Arbeitstage hat ein Jahr?</h2>
<p>Ein Jahr hat 260 bis 262 Montage-bis-Freitage. Davon gehen die gesetzlichen Feiertage
ab, die auf Werktage fallen – je nach Bundesland zwischen 9 (z. B. in Bayern sind es
insgesamt 13 Feiertage, aber nicht alle fallen auf Mo–Fr) und den bundesweit einheitlichen
9 Feiertagen. In der Praxis liegen die Arbeitstage eines Jahres daher meist zwischen
248 und 254 – vor Abzug des eigenen Urlaubs.</p>
<h2>Feiertage: der Bundesland-Faktor</h2>
<p>Bundesweit gelten 9 gesetzliche Feiertage (u. a. Neujahr, Karfreitag, Ostermontag,
1. Mai, Tag der Deutschen Einheit, 1. und 2. Weihnachtstag). Bayern kommt mit regionalen
Zusätzen auf bis zu 14, Berlin und die Nordländer liegen bei 10–11. Zähle für deinen
Zeitraum kurz die Feiertage, die auf Montag bis Freitag fallen, und trage die Zahl oben
ein – so bleibt das Ergebnis für jedes Bundesland korrekt.</p>
<h2>Wofür die Zahl gebraucht wird</h2>
<ul>
<li><b>Steuererklärung:</b> Das Finanzamt akzeptiert für die Pendlerpauschale je nach
Bundesland und 5-Tage-Woche üblicherweise 220–230 Fahrten pro Jahr.</li>
<li><b>Projektplanung:</b> Aufwand in Personentagen realistisch auf den Kalender legen.</li>
<li><b>Gehalt:</b> Tagessätze berechnen (Monatsgehalt ÷ durchschnittlich 21,75
Arbeitstage).</li>
</ul>`,
  faq: [
    { q: 'Wie viele Arbeitstage hat ein Monat im Durchschnitt?',
      a: 'Rund 21,75 (261 Werktage ÷ 12), vor Abzug von Feiertagen. Reale Monate schwanken zwischen 20 und 23 Arbeitstagen.' },
    { q: 'Zählt Heiligabend als Arbeitstag?',
      a: 'Der 24. und 31. Dezember sind keine gesetzlichen Feiertage – arbeitsfrei sind sie nur, wenn Tarif- oder Arbeitsvertrag das regeln. Viele Betriebe geben frei oder verlangen einen halben Urlaubstag.' },
    { q: 'Wie viele Arbeitstage akzeptiert das Finanzamt für die Pendlerpauschale?',
      a: 'Bei einer 5-Tage-Woche werden üblicherweise 220–230 Tage ohne Nachweis anerkannt. Wer mehr ansetzt, sollte die Tage belegen können (z. B. Arbeitgeberbescheinigung).' }
  ]
};
