module.exports = {
  slug: 'schlafrechner',
  title: 'Schlafrechner',
  teaser: 'Beste Aufsteh- oder Einschlafzeit nach Schlafzyklen finden.',
  h1: 'Schlafrechner – wann aufstehen, wann ins Bett?',
  metaTitle: 'Schlafrechner – optimale Aufsteh- & Einschlafzeit berechnen',
  metaDesc: 'Ausgeruhter aufwachen: Der Schlafrechner ermittelt anhand von 90-Minuten-Schlafzyklen die besten Zeiten zum Aufstehen oder Zubettgehen.',
  category: 'gesundheit',
  intro: `<p>Wir schlafen in Zyklen von etwa 90 Minuten. Wer am Ende eines Zyklus
aufwacht statt mittendrin, fühlt sich deutlich frischer. Der Rechner schlägt dir passende
Aufsteh- oder Zubettgeh-Zeiten vor – inklusive ~15 Minuten Einschlafzeit.</p>`,
  form: `
<div class="feld"><label for="modus">Was möchtest du wissen?</label>
  <select id="modus"><option value="wecker">Ich gehe jetzt/um … ins Bett → Wann aufstehen?</option>
  <option value="bett">Ich muss um … aufstehen → Wann ins Bett?</option></select></div>
<div class="feld"><label for="zeit" id="zeitLabel">Zubettgeh-Zeit</label>
  <input id="zeit" type="time" value="23:00"></div>`,
  script: `
function berechnen(){
  var modus=$('modus').value, zeit=$('zeit').value;
  $('zeitLabel').textContent = modus==='wecker' ? 'Zubettgeh-Zeit' : 'Aufstehzeit (Wecker)';
  if(!zeit) return warten();
  var t=zeit.split(':'), min=(+t[0])*60+(+t[1]);
  var einschlafen=15, zyklus=90, zeilen='';
  for(var z=6;z>=4;z--){
    var m = modus==='wecker' ? (min+einschlafen+z*zyklus) : (min-einschlafen-z*zyklus);
    m=((m%1440)+1440)%1440;
    var hh=String(Math.floor(m/60)).padStart(2,'0'), mm=String(m%60).padStart(2,'0');
    zeilen+='<tr><td>'+z+' Zyklen ('+fmt(z*1.5,1)+' Std. Schlaf)'+(z===5?' – Empfehlung':'')+'</td><td><b>'+hh+':'+mm+' Uhr</b></td></tr>';
  }
  zeigen('<p>'+(modus==='wecker'?'Gute Weckzeiten:':'Gute Zubettgeh-Zeiten:')+'</p><table>'+zeilen+'</table>'+
    '<p class="hint">Gerechnet mit 90-Minuten-Zyklen plus 15 Minuten Einschlafzeit.</p>');
}`,
  content: `
<h2>Warum Schlafzyklen zählen</h2>
<p>Eine Nacht besteht aus 4–6 Zyklen von je etwa 90 Minuten, in denen sich Leichtschlaf,
Tiefschlaf und REM-Schlaf abwechseln. Klingelt der Wecker mitten im Tiefschlaf, fühlt man
sich wie gerädert – am Ende eines Zyklus dagegen relativ wach, selbst bei etwas weniger
Gesamtschlaf. Deshalb sind 7,5 Stunden (5 Zyklen) oft erholsamer als 8 Stunden mit Weckruf
im Tiefschlaf.</p>
<h2>Tipps für besseren Schlaf</h2>
<ul>
<li>Feste Zeiten: Möglichst jeden Tag zur ähnlichen Zeit aufstehen – auch am Wochenende.</li>
<li>Abends Bildschirmlicht dimmen; Koffein ab dem frühen Nachmittag meiden.</li>
<li>Schlafzimmer kühl (16–19 °C), dunkel und leise halten.</li>
<li>Die 90 Minuten sind ein Durchschnitt – beobachte, mit welcher Zyklenzahl du dich am
besten fühlst, und passe deine Zeiten an.</li>
</ul>`,
  faq: [
    { q: 'Wie viel Schlaf braucht ein Erwachsener?',
      a: 'Die meisten Erwachsenen brauchen 7 bis 9 Stunden. Dauerhaft weniger als 6 Stunden erhöhen das Risiko für Konzentrationsprobleme, Übergewicht und Herz-Kreislauf-Erkrankungen.' },
    { q: 'Was bringt die 90-Minuten-Regel wirklich?',
      a: 'Sie ist eine Faustregel: Die Zykluslänge variiert individuell zwischen etwa 80 und 110 Minuten. Als Ausgangspunkt funktioniert sie gut – feinjustieren musst du nach eigenem Empfinden.' },
    { q: 'Ist der Schlaf vor Mitternacht wertvoller?',
      a: 'Nicht die Uhrzeit ist entscheidend, sondern die erste Nachthälfte: Dort liegt der meiste Tiefschlaf – egal, ob du um 22 oder um 1 Uhr einschläfst. Wichtig ist, dass die Schlafenszeit zu deinem Chronotyp passt und lang genug ist.' }
  ],
  disclaimer: 'Orientierungshilfe, keine medizinische Beratung. Bei anhaltenden Schlafproblemen ärztlichen Rat einholen.'
};
