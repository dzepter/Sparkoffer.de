module.exports = {
  slug: 'schwangerschaftsrechner',
  title: 'Schwangerschaftsrechner',
  teaser: 'Entbindungstermin und aktuelle SSW berechnen.',
  h1: 'Schwangerschaftsrechner – Entbindungstermin & SSW berechnen',
  metaTitle: 'Schwangerschaftsrechner – Geburtstermin & SSW berechnen',
  metaDesc: 'Wann kommt das Baby? Berechne den voraussichtlichen Entbindungstermin und deine aktuelle Schwangerschaftswoche (SSW) aus der letzten Periode.',
  category: 'gesundheit',
  intro: `<p>Aus dem ersten Tag deiner letzten Periode berechnet dieser Rechner den
voraussichtlichen Entbindungstermin (ET) nach der Naegele-Regel sowie deine aktuelle
Schwangerschaftswoche (SSW) und das Trimester.</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="periode">Erster Tag der letzten Periode</label>
    <input id="periode" type="date"></div>
  <div class="feld"><label for="zyklus">Zykluslänge (Tage)</label>
    <input id="zyklus" type="number" min="20" max="45" step="1" value="28"></div>
</div>`,
  script: `
function berechnen(){
  var p=$('periode').value, zyklus=n('zyklus')||28;
  if(!p) return warten();
  var start=new Date(p+'T00:00:00');
  if(isNaN(start)) return warten();
  var et=new Date(start.getTime()+(280+(zyklus-28))*86400000);
  var heute=new Date(); heute.setHours(0,0,0,0);
  var tage=Math.floor((heute-start)/86400000);
  var fmtD=function(d){return d.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})};
  var html='<p>Voraussichtlicher Entbindungstermin:</p><p class="gross">'+fmtD(et)+'</p>';
  if(tage>=0&&tage<=310){
    var woche=Math.floor(tage/7), tagInWoche=tage%7;
    var ssw=(woche+1); var tri=tage<98?1:(tage<196?2:3);
    var rest=Math.max(0,Math.round((et-heute)/86400000));
    html+='<table><tr><td>Aktuelle Schwangerschaftswoche</td><td>SSW '+ssw+' ('+woche+'+'+tagInWoche+')</td></tr>'+
      '<tr><td>Trimester</td><td>'+tri+'. Trimester</td></tr>'+
      '<tr><td>Tage bis zum ET</td><td>ca. '+rest+'</td></tr></table>';
  }
  zeigen(html+'<p class="hint">Naegele-Regel: letzte Periode + 280 Tage, korrigiert um die Zykluslänge.</p>');
}`,
  content: `
<h2>Wie der Entbindungstermin berechnet wird</h2>
<p>Die Naegele-Regel rechnet vom ersten Tag der letzten Periode 280 Tage (40 Wochen) nach
vorn. Bei Zyklen, die kürzer oder länger als 28 Tage sind, wird die Differenz angepasst –
das macht dieser Rechner automatisch. Ärzte präzisieren den Termin meist per Ultraschall
im ersten Trimester, wenn sich die Größe des Embryos noch sehr genau datieren lässt.</p>
<h2>Wie verlässlich ist der Termin?</h2>
<p>Nur etwa 4 % der Kinder kommen genau am errechneten Termin zur Welt – rund 90 % werden
in den zwei Wochen davor oder danach geboren. Der ET ist also ein statistischer Ankerpunkt
für Vorsorge, Mutterschutz (Beginn: 6 Wochen vor dem ET) und Planung, kein Verfallsdatum.</p>`,
  faq: [
    { q: 'Wie werden Schwangerschaftswochen gezählt?',
      a: 'Ab dem ersten Tag der letzten Periode – also inklusive der etwa zwei Wochen vor der eigentlichen Befruchtung. Die Schreibweise „12+3“ bedeutet: 12 vollendete Wochen plus 3 Tage, das entspricht SSW 13.' },
    { q: 'Wann beginnt der Mutterschutz?',
      a: 'Sechs Wochen vor dem errechneten Entbindungstermin. Nach der Geburt gilt eine Schutzfrist von acht Wochen (zwölf bei Früh- und Mehrlingsgeburten), in der ein Beschäftigungsverbot besteht.' },
    { q: 'Ab wann gilt ein Baby als übertragen?',
      a: 'Ab 42+0, also zwei Wochen nach dem ET. Schon ab dem Termin überwachen Ärztinnen und Hebammen engmaschiger; eine Einleitung wird meist zwischen ET+7 und ET+14 besprochen.' }
  ],
  disclaimer: 'Orientierungswert, keine medizinische Beratung – verbindlich ist die ärztliche Feststellung (z. B. per Ultraschall).'
};
