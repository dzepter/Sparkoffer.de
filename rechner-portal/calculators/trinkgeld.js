module.exports = {
  slug: 'trinkgeld-rechner',
  title: 'Trinkgeld-Rechner',
  teaser: 'Trinkgeld berechnen und Rechnung durch Personen teilen.',
  h1: 'Trinkgeld-Rechner – Trinkgeld & Rechnungsteilung',
  metaTitle: 'Trinkgeld-Rechner – wie viel Trinkgeld ist angemessen?',
  metaDesc: 'Trinkgeld schnell berechnen: Prozentsatz wählen, Rechnung eingeben, auf Personen aufteilen. Mit Knigge für Deutschland und das Ausland.',
  category: 'alltag',
  intro: `<p>Rechnung da, kurze Kopfrechnung nötig: Dieser Rechner ermittelt das Trinkgeld
nach deinem Wunsch-Prozentsatz, rundet auf Wunsch auf einen glatten Betrag und teilt die
Gesamtsumme durch alle Personen am Tisch.</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="betrag">Rechnungsbetrag (€)</label>
    <input id="betrag" type="number" min="0" step="0.1" placeholder="z. B. 47,80"></div>
  <div class="feld"><label for="satz">Trinkgeld (%)</label>
    <select id="satz"><option value="5">5 % – okay</option><option value="10" selected>10 % – üblich</option>
    <option value="15">15 % – sehr zufrieden</option><option value="20">20 % – ausgezeichnet</option></select></div>
  <div class="feld"><label for="personen">Personen</label>
    <input id="personen" type="number" min="1" max="50" step="1" value="1"></div>
  <div class="feld"><label for="runden">Auf glatten Betrag runden?</label>
    <select id="runden"><option value="1" selected>ja, aufrunden</option><option value="0">nein, exakt</option></select></div>
</div>`,
  script: `
function berechnen(){
  var b=n('betrag'), satz=n('satz'), pers=Math.max(1,Math.round(n('personen')||1)), runden=$('runden').value==='1';
  if(!(b>0)) return warten();
  var gesamt=b*(1+satz/100);
  if(runden) gesamt=Math.ceil(gesamt);
  var tip=gesamt-b;
  zeigen('<table>'+
    '<tr><td>Rechnung</td><td>'+eur(b)+'</td></tr>'+
    '<tr><td>Trinkgeld ('+fmt(tip/b*100,1)+' %)</td><td>'+eur(tip)+'</td></tr>'+
    '<tr class="summe"><td>Zu zahlen</td><td><span class="gross">'+eur(gesamt)+'</span></td></tr>'+
    (pers>1?'<tr><td>Pro Person ('+pers+')</td><td>'+eur(gesamt/pers)+'</td></tr>':'')+
    '</table>');
}`,
  content: `
<h2>Wie viel Trinkgeld gibt man in Deutschland?</h2>
<p>Üblich sind <b>5 bis 10 %</b> im Restaurant, bei besonders gutem Service auch mehr.
Verbreitet ist das Aufrunden auf einen glatten Betrag: Aus 47,80 € werden 52 oder 53 €.
Trinkgeld ist freiwillig – bei schlechtem Service darf es auch entfallen. Beim Bezahlen
sagt man den Gesamtbetrag an („Machen Sie 52“) oder gibt das Trinkgeld bar, das kommt
beim Personal am sichersten an.</p>
<h2>Trinkgeld im Ausland</h2>
<p>In den <b>USA</b> sind 18–22 % faktisch Pflicht, weil Trinkgeld Teil des Lohns ist. In
<b>Südeuropa</b> genügt oft Aufrunden oder 5–10 %. In <b>Japan</b> ist Trinkgeld unüblich
und kann sogar als unhöflich gelten. Bei Kartenzahlung im Ausland: das Trinkgeld möglichst
bar geben – nicht überall wird es sonst weitergereicht.</p>`,
  faq: [
    { q: 'Muss Trinkgeld versteuert werden?',
      a: 'Freiwilliges Trinkgeld vom Gast direkt ans Personal ist in Deutschland steuerfrei (§ 3 Nr. 51 EStG). Bedienzuschläge, die der Betrieb erhebt, sind dagegen steuerpflichtig.' },
    { q: 'Gibt man auch beim Liefern und Abholen Trinkgeld?',
      a: 'Beim Lieferdienst sind 1–3 € oder rund 10 % üblich, besonders bei schlechtem Wetter oder vielen Stockwerken. Beim Abholen ist Trinkgeld optional.' },
    { q: 'Trinkgeld bei Kartenzahlung – geht das?',
      a: 'Ja, sag einfach vor dem Bezahlen den Gesamtbetrag inklusive Trinkgeld an. Viele Terminals fragen inzwischen auch selbst danach. Bar bleibt trotzdem die sicherste Variante, damit das Geld direkt beim Servicepersonal ankommt.' }
  ]
};
