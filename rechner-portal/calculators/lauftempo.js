module.exports = {
  slug: 'pace-rechner',
  title: 'Pace-Rechner (Lauftempo)',
  teaser: 'Pace, Geschwindigkeit und Zielzeiten fürs Laufen berechnen.',
  h1: 'Pace-Rechner – Lauftempo und Zielzeiten berechnen',
  metaTitle: 'Pace-Rechner – min/km, km/h & Zielzeiten fürs Laufen',
  metaDesc: 'Berechne deine Pace (min/km) und Geschwindigkeit aus Strecke und Zeit – mit Prognosen für 5 km, 10 km, Halbmarathon und Marathon.',
  category: 'alltag',
  intro: `<p>Nach dem Lauf oder vor dem Wettkampf: Gib Strecke und Zeit ein – der Rechner
zeigt deine Pace (Minuten pro Kilometer), die Geschwindigkeit in km/h und was dein Tempo
auf den Standarddistanzen bedeuten würde.</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="strecke">Strecke (km)</label>
    <input id="strecke" type="number" min="0.1" step="0.1" placeholder="z. B. 10"></div>
  <div class="feld"><label for="std">Zeit: Stunden</label>
    <input id="std" type="number" min="0" max="24" step="1" value="0"></div>
  <div class="feld"><label for="minu">Minuten</label>
    <input id="minu" type="number" min="0" max="59" step="1" placeholder="z. B. 55"></div>
  <div class="feld"><label for="sek">Sekunden</label>
    <input id="sek" type="number" min="0" max="59" step="1" value="0"></div>
</div>`,
  script: `
function zeit(s){
  var h=Math.floor(s/3600), m=Math.floor(s%3600/60), sec=Math.round(s%60);
  return (h?h+':':'')+String(m).padStart(h?2:1,'0')+':'+String(sec).padStart(2,'0');
}
function berechnen(){
  var km=n('strecke'), s=(n('std')||0)*3600+(n('minu')||0)*60+(n('sek')||0);
  if(!(km>0)||!(s>0)) return warten();
  var proKm=s/km, kmh=km/(s/3600);
  var dist=[['5 km',5],['10 km',10],['Halbmarathon (21,1 km)',21.0975],['Marathon (42,2 km)',42.195]];
  var zeilen=dist.map(function(d){return '<tr><td>'+d[0]+'</td><td>'+zeit(proKm*d[1])+'</td></tr>';}).join('');
  zeigen('<p>Deine Pace:</p><p class="gross">'+zeit(proKm)+' min/km</p>'+
    '<table><tr><td>Geschwindigkeit</td><td>'+fmt(kmh,2)+' km/h</td></tr>'+zeilen+'</table>'+
    '<p class="hint">Die Distanz-Zeiten gelten für konstantes Tempo – auf längeren Strecken läuft man real meist langsamer.</p>');
}`,
  content: `
<h2>Was ist die Pace?</h2>
<p>Die Pace ist das Standardmaß im Laufsport: die Zeit pro Kilometer, angegeben als
min:sek. Eine Pace von 6:00 min/km entspricht 10 km/h; 5:00 min/km sind 12 km/h. Die
Umrechnung lautet <b>km/h = 60 ÷ Pace in Minuten</b>. Gängige Orientierung: Einsteiger
laufen oft 6:30–7:30 min/km, ambitionierte Hobbyläufer 4:30–5:30 min/km.</p>
<h2>Zielzeiten realistisch hochrechnen</h2>
<p>Die Tabellenwerte gelten für gleichbleibendes Tempo. Real sinkt das Tempo mit der
Distanz: Als Faustregel (Riegel-Formel) verlängert sich die Zeit bei doppelter Strecke um
den Faktor ~2,12 statt 2,0. Wer 10 km in 55 Minuten läuft, sollte für den Halbmarathon
also eher mit 2:02 h planen als mit den rechnerischen 1:56 h – Training für die
Langdistanz vorausgesetzt.</p>`,
  faq: [
    { q: 'Was ist eine gute Pace für Anfänger?',
      a: 'Für den Einstieg zählt Durchhalten vor Tempo: 7:00–8:00 min/km im Wohlfühlbereich sind völlig normal. Wichtig ist, dass du dich beim Laufen noch unterhalten könntest (Plaudertempo).' },
    { q: 'Wie rechne ich Pace in km/h um?',
      a: '60 geteilt durch die Pace in Minuten: 5:30 min/km sind 60 ÷ 5,5 = 10,9 km/h. Umgekehrt: 60 ÷ km/h ergibt die Pace in Minuten.' },
    { q: 'Welche Pace brauche ich für einen 4-Stunden-Marathon?',
      a: 'Etwa 5:41 min/km durchgehend (42,195 km in 240 Minuten). Inklusive Verpflegungsstopps peilen viele im Training eher 5:30–5:35 min/km als Wettkampftempo an.' }
  ]
};
