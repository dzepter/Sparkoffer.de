module.exports = {
  slug: 'tage-rechner',
  title: 'Tage-Rechner',
  teaser: 'Tage zwischen zwei Daten zählen – z. B. bis zum Urlaub.',
  h1: 'Tage-Rechner – Tage zwischen zwei Daten berechnen',
  metaTitle: 'Tage-Rechner – Tage zwischen zwei Daten zählen',
  metaDesc: 'Wie viele Tage bis Urlaub, Prüfung oder Hochzeit? Berechne den Abstand zwischen zwei Daten in Tagen, Wochen und Wochentagen – kostenlos.',
  category: 'alltag',
  intro: `<p>Wie viele Tage sind es noch bis zum Urlaub – oder wie viele Tage liegen
zwischen zwei Terminen? Wähle zwei Daten, der Rechner zählt Tage, Wochen und die
enthaltenen Werktage (Montag bis Freitag).</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="von">Startdatum</label><input id="von" type="date"></div>
  <div class="feld"><label for="bis">Enddatum</label><input id="bis" type="date"></div>
</div>
<div class="feld"><label for="inkl">Zählweise</label>
  <select id="inkl"><option value="0">Differenz (Enddatum nicht mitzählen)</option>
  <option value="1">beide Tage einschließen</option></select></div>`,
  script: `
function berechnen(){
  var v=$('von').value, b=$('bis').value, inkl=$('inkl').value==='1';
  if(!v||!b) return warten();
  var d1=new Date(v+'T00:00:00'), d2=new Date(b+'T00:00:00');
  if(isNaN(d1)||isNaN(d2)) return warten();
  if(d2<d1){var t=d1;d1=d2;d2=t;}
  var tage=Math.round((d2-d1)/86400000)+(inkl?1:0);
  var werktage=0, d=new Date(d1);
  var ende=new Date(d2); if(inkl) ende.setDate(ende.getDate()+1);
  while(d<ende){ var wt=d.getDay(); if(wt!==0&&wt!==6) werktage++; d.setDate(d.getDate()+1); }
  if(!inkl && d1.getDay()!==0 && d1.getDay()!==6) werktage--; /* Startdatum bei Differenz nicht mitzählen */
  var wochen=Math.floor(tage/7), rest=tage%7;
  zeigen('<p>Zwischen den beiden Daten liegen:</p><p class="gross">'+fmt(tage,0)+' Tage</p>'+
    '<table><tr><td>Das entspricht</td><td>'+wochen+' Wochen'+(rest?' und '+rest+' Tage':'')+'</td></tr>'+
    '<tr><td>Werktage (Mo–Fr)</td><td>'+Math.max(0,werktage)+'</td></tr>'+
    '<tr><td>In Monaten (Ø 30,44 Tage)</td><td>'+fmt(tage/30.44,1)+'</td></tr></table>');
}`,
  content: `
<h2>Differenz oder einschließlich – was ist richtig?</h2>
<p>Das hängt von der Frage ab. „Wie viele Nächte bleibe ich im Hotel?“ oder „In wie
vielen Tagen ist der Termin?“ verlangen die reine <b>Differenz</b> (2.–5. des Monats =
3 Tage). „Wie viele Tage dauert die Veranstaltung?“ zählt dagegen <b>beide Tage mit</b>
(2.–5. = 4 Tage). Auch Fristen im Rechtsverkehr haben eigene Zählregeln – im Zweifel
beginnt eine Frist am Tag nach dem Ereignis (§ 187 BGB).</p>
<h2>Praktische Anwendungen</h2>
<ul>
<li>Countdown bis Urlaub, Hochzeit, Prüfung oder Renteneintritt</li>
<li>Vertragslaufzeiten und Kündigungsfristen überschlagen</li>
<li>Projektdauer in Werktagen abschätzen – Feiertage musst du dabei selbst abziehen, sie
unterscheiden sich je nach Bundesland (siehe <a href="/arbeitstage-rechner/">Arbeitstage-Rechner</a>)</li>
</ul>`,
  faq: [
    { q: 'Zählt der Rechner Schaltjahre mit?',
      a: 'Ja. Die Rechnung basiert auf echten Kalenderdaten, der 29. Februar wird in Schaltjahren automatisch berücksichtigt.' },
    { q: 'Wie viele Tage hat ein Monat im Durchschnitt?',
      a: '365,25 Tage ÷ 12 = 30,44 Tage. Diese Zahl nutzt der Rechner für die Monats-Angabe – reale Monate schwanken zwischen 28 und 31 Tagen.' },
    { q: 'Was ist der Unterschied zwischen Werktag und Arbeitstag?',
      a: 'Werktage sind gesetzlich Montag bis Samstag, Arbeitstage meist Montag bis Freitag. Dieser Rechner zählt Montag bis Freitag, da das im Alltag fast immer gemeint ist.' }
  ]
};
