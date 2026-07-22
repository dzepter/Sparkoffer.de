module.exports = {
  slug: 'brutto-netto-rechner',
  title: 'Brutto-Netto-Rechner',
  teaser: 'Was bleibt vom Gehalt? Netto-Schätzung mit allen Abzügen.',
  h1: 'Brutto-Netto-Rechner 2025 – was bleibt vom Gehalt?',
  metaTitle: 'Brutto-Netto-Rechner 2025 – Nettogehalt schnell berechnen',
  metaDesc: 'Wie viel Netto bleibt von deinem Brutto? Kostenloser Brutto-Netto-Rechner mit Lohnsteuer, Kranken-, Renten- und Pflegeversicherung – Stand 2025.',
  category: 'finanzen',
  intro: `<p>Gib dein monatliches Bruttogehalt ein und sieh sofort, was nach Steuern und
Sozialabgaben übrig bleibt – aufgeschlüsselt nach Lohnsteuer, Kranken-, Pflege-,
Renten- und Arbeitslosenversicherung (Rechenstand 2025).</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="brutto">Bruttogehalt pro Monat (€)</label>
    <input id="brutto" type="number" min="0" step="50" placeholder="z. B. 3200"></div>
  <div class="feld"><label for="stk">Steuerklasse</label>
    <select id="stk"><option value="1">I – ledig</option><option value="2">II – alleinerziehend</option>
    <option value="3">III – verheiratet (höheres Einkommen)</option><option value="4">IV – verheiratet (ähnliches Einkommen)</option></select></div>
  <div class="feld"><label for="kist">Kirchensteuer</label>
    <select id="kist"><option value="0">keine</option><option value="9">9 % (die meisten Bundesländer)</option><option value="8">8 % (Bayern, Baden-Württemberg)</option></select></div>
  <div class="feld"><label for="zusatz">Zusatzbeitrag deiner Krankenkasse (%)</label>
    <input id="zusatz" type="number" min="0" max="5" step="0.1" value="2.5"></div>
  <div class="feld"><label for="kinder">Kinder (für Pflegeversicherung)</label>
    <select id="kinder"><option value="1">mind. 1 Kind</option><option value="0">kinderlos, über 23</option></select></div>
</div>`,
  script: `
function est2025(zvE){
  zvE = Math.floor(zvE);
  if (zvE <= 12096) return 0;
  if (zvE <= 17443){ var y=(zvE-12096)/10000; return Math.floor((932.30*y+1400)*y); }
  if (zvE <= 68480){ var z=(zvE-17443)/10000; return Math.floor((176.64*z+2397)*z+1015.13); }
  if (zvE <= 277825) return Math.floor(0.42*zvE-10911.92);
  return Math.floor(0.45*zvE-19246.67);
}
function berechnen(){
  var brutto=n('brutto');
  if(!(brutto>0)) return warten();
  var stk=$('stk').value, kiSatz=+$('kist').value, zusatz=n('zusatz')||0, kinderlos=$('kinder').value==='0';
  var kvB=Math.min(brutto,5512.50), rvB=Math.min(brutto,8050);
  var kv=kvB*(0.073+zusatz/200);
  var pv=kvB*(0.018+(kinderlos?0.006:0));
  var rv=rvB*0.093, av=rvB*0.013;
  var sv=kv+pv+rv+av;
  var zvE=Math.max(0,12*brutto-1230-36-12*(rv+kv+pv));
  if(stk==='2') zvE=Math.max(0,zvE-4260);
  var est=(stk==='3')?2*est2025(zvE/2):est2025(zvE);
  var fg=(stk==='3')?39900:19950;
  var soli=est<=fg?0:Math.min(0.055*est,0.119*(est-fg));
  var kist=est*kiSatz/100;
  var steuerM=(est+soli+kist)/12;
  var netto=brutto-sv-steuerM;
  zeigen('<table>'+
    '<tr><td>Bruttogehalt</td><td>'+eur(brutto)+'</td></tr>'+
    '<tr><td>Lohnsteuer (anteilig)</td><td>−'+eur(est/12)+'</td></tr>'+
    (soli>0?'<tr><td>Solidaritätszuschlag</td><td>−'+eur(soli/12)+'</td></tr>':'')+
    (kist>0?'<tr><td>Kirchensteuer</td><td>−'+eur(kist/12)+'</td></tr>':'')+
    '<tr><td>Krankenversicherung</td><td>−'+eur(kv)+'</td></tr>'+
    '<tr><td>Pflegeversicherung</td><td>−'+eur(pv)+'</td></tr>'+
    '<tr><td>Rentenversicherung</td><td>−'+eur(rv)+'</td></tr>'+
    '<tr><td>Arbeitslosenversicherung</td><td>−'+eur(av)+'</td></tr>'+
    '<tr class="summe"><td>Netto pro Monat</td><td><span class="gross">'+eur(netto)+'</span></td></tr>'+
    '<tr><td>Netto pro Jahr (12 Gehälter)</td><td>'+eur(netto*12)+'</td></tr>'+
    '</table><p class="hint">Unverbindliche Schätzung nach dem Einkommensteuertarif 2025 '+
    '(vereinfachte Vorsorgepauschale, ohne Kinderfreibeträge und Freibeträge auf der Lohnsteuerkarte).</p>');
}`,
  content: `
<h2>So setzt sich dein Nettogehalt zusammen</h2>
<p>Vom Bruttogehalt gehen in Deutschland zwei große Blöcke ab: <b>Steuern</b> (Lohnsteuer,
ggf. Solidaritätszuschlag und Kirchensteuer) und <b>Sozialversicherungen</b>. Als
Arbeitnehmer zahlst du 2025 jeweils die Hälfte der Beiträge: 7,3 % plus den halben
Zusatzbeitrag für die Krankenversicherung, 9,3 % für die Rente, 1,3 % für die
Arbeitslosenversicherung und 1,8 % für die Pflege (Kinderlose ab 23 zahlen 0,6
Prozentpunkte mehr). Oberhalb der Beitragsbemessungsgrenzen (2025: 5.512,50 € monatlich
für Kranken- und Pflegeversicherung, 8.050 € für Rente und Arbeitslosenversicherung)
steigen die Beiträge nicht weiter.</p>
<h2>Warum das Ergebnis eine Schätzung ist</h2>
<p>Die exakte Lohnsteuer hängt von Details ab, die kein Online-Rechner vollständig kennt:
eingetragene Freibeträge, Kinderfreibeträge, private Krankenversicherung, Steuerklasse V/VI
oder mehrere Arbeitgeber. Unser Rechner nutzt den amtlichen Einkommensteuertarif 2025 und
die üblichen Pauschalen – für die Steuerklassen I bis IV liegt das Ergebnis typischerweise
nah an der Gehaltsabrechnung, ersetzt sie aber nicht.</p>`,
  faq: [
    { q: 'Wie viel Prozent gehen ungefähr vom Brutto ab?',
      a: 'Als Faustregel bleiben bei Steuerklasse I zwischen 60 und 70 % des Bruttos übrig. Je höher das Gehalt, desto größer der prozentuale Abzug, weil der Steuersatz mit dem Einkommen steigt (Steuerprogression).' },
    { q: 'Was ist der Unterschied zwischen Steuerklasse III und IV?',
      a: 'Beide gibt es nur für Verheiratete. Bei ähnlich hohen Gehältern wählen beide Partner IV. Verdient einer deutlich mehr, bringt die Kombination III/V dem Vielverdiener ein höheres monatliches Netto – die endgültige Steuer wird aber erst mit der Steuererklärung abgerechnet.' },
    { q: 'Zahlt jeder den Solidaritätszuschlag?',
      a: 'Nein. Seit 2021 fällt der Soli erst oberhalb einer Freigrenze an (2025: 19.950 € Einkommensteuer pro Jahr bei Einzelveranlagung). Rund 90 % der Beschäftigten zahlen dadurch keinen Soli mehr.' }
  ],
  disclaimer: 'Alle Angaben ohne Gewähr, Rechenstand 2025. Dieser Rechner liefert eine unverbindliche Näherung und ersetzt keine Steuerberatung und keine Gehaltsabrechnung.'
};
