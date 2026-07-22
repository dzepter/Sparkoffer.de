module.exports = {
  slug: 'alter-rechner',
  title: 'Alters-Rechner',
  teaser: 'Exaktes Alter in Jahren, Monaten und Tagen berechnen.',
  h1: 'Alters-Rechner – exaktes Alter auf den Tag genau',
  metaTitle: 'Alters-Rechner – Alter in Jahren, Monaten & Tagen berechnen',
  metaDesc: 'Wie alt bist du auf den Tag genau? Berechne dein exaktes Alter in Jahren, Monaten und Tagen – plus Countdown zum nächsten Geburtstag.',
  category: 'alltag',
  intro: `<p>Auf den Tag genau: Dieser Rechner ermittelt aus dem Geburtsdatum das exakte
Alter in Jahren, Monaten und Tagen, die Gesamtzahl der gelebten Tage und wie lange es
noch bis zum nächsten Geburtstag dauert.</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="geburt">Geburtsdatum</label><input id="geburt" type="date"></div>
  <div class="feld"><label for="stichtag">Stichtag (Standard: heute)</label><input id="stichtag" type="date"></div>
</div>`,
  script: `
function berechnen(){
  var g=$('geburt').value; if(!g) return warten();
  var geb=new Date(g+'T00:00:00');
  var s=$('stichtag').value;
  var heute=s?new Date(s+'T00:00:00'):new Date(); heute.setHours(0,0,0,0);
  if(isNaN(geb)||geb>heute) return warten();
  var j=heute.getFullYear()-geb.getFullYear();
  var m=heute.getMonth()-geb.getMonth();
  var t=heute.getDate()-geb.getDate();
  if(t<0){ m--; t+=new Date(heute.getFullYear(),heute.getMonth(),0).getDate(); }
  if(m<0){ j--; m+=12; }
  var tageGesamt=Math.floor((heute-geb)/86400000);
  var naechster=new Date(heute.getFullYear(),geb.getMonth(),geb.getDate());
  if(naechster<=heute) naechster.setFullYear(naechster.getFullYear()+1);
  var bisGeb=Math.round((naechster-heute)/86400000);
  zeigen('<p>Exaktes Alter:</p><p class="gross">'+j+' Jahre, '+m+' Monate, '+t+' Tage</p>'+
    '<table><tr><td>Gelebte Tage</td><td>'+fmt(tageGesamt,0)+'</td></tr>'+
    '<tr><td>Gelebte Wochen</td><td>'+fmt(tageGesamt/7,0)+'</td></tr>'+
    '<tr><td>Nächster Geburtstag ('+(j+1)+'.)</td><td>in '+bisGeb+' Tagen</td></tr></table>');
}`,
  content: `
<h2>Wofür man das exakte Alter braucht</h2>
<p>Viele Fristen und Ansprüche hängen am taggenauen Alter: Versicherungen rechnen mit dem
Eintrittsalter, bei Altersgrenzen (Führerschein, Wahlrecht, Rente) zählt der konkrete
Geburtstag, und in Bewerbungen oder amtlichen Formularen wird das vollendete Lebensjahr
verlangt. Auch beliebt: die eigenen „krummen“ Jubiläen wie den 10.000. Lebenstag
ausrechnen – bei einem heute 27-Jährigen liegt er meist schon hinter ihm.</p>
<h2>So rechnet der Kalender</h2>
<p>Ein Jahr ist nicht einfach 365 Tage: Schaltjahre schieben alle vier Jahre einen Tag
ein (Ausnahme: volle Jahrhunderte, die nicht durch 400 teilbar sind). Der Rechner nutzt
deshalb echte Kalenderdaten statt Durchschnittswerten – dein Alter in Jahren, Monaten und
Tagen stimmt damit auf den Tag genau.</p>`,
  faq: [
    { q: 'Wann vollendet man ein Lebensjahr – am Geburtstag oder davor?',
      a: 'Juristisch vollendet man das Lebensjahr mit Ablauf des Tages vor dem Geburtstag (§ 187 Abs. 2 BGB). Volljährig wird man also streng genommen um Mitternacht zu Beginn des 18. Geburtstags.' },
    { q: 'Wie alt in Wochen ist ein Baby?',
      a: 'Gib das Geburtsdatum ein – die Zeile „Gelebte Wochen“ zeigt das Alter in Wochen, wie es bei Säuglingen üblich ist (bis etwa zum 6. Monat wird in Wochen gezählt).' },
    { q: 'Was ist ein „halbrunder“ Geburtstag?',
      a: 'Jubiläen wie 25, 75 oder auch 33⅓ – gemeint sind alle Geburtstage außerhalb der vollen Zehner. Mit dem Stichtag-Feld kannst du solche Termine gezielt prüfen.' }
  ]
};
