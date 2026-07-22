module.exports = {
  slug: 'promillerechner',
  title: 'Promillerechner',
  teaser: 'Blutalkohol nach Getränken abschätzen – mit Abbauzeit.',
  h1: 'Promillerechner – Blutalkohol grob abschätzen',
  metaTitle: 'Promillerechner – Blutalkoholwert & Abbauzeit abschätzen',
  metaDesc: 'Wie viel Promille nach 2 Bier und einem Glas Wein? Promillerechner nach der Widmark-Formel mit geschätzter Abbauzeit – nur zur Orientierung.',
  category: 'gesundheit',
  intro: `<p>Dieser Rechner schätzt den maximalen Blutalkoholwert nach der
Widmark-Formel und die grobe Abbauzeit. <b>Wichtig:</b> Das Ergebnis ist eine
theoretische Näherung – es taugt niemals als Entscheidungsgrundlage, ob du noch fahren
darfst.</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="geschlecht">Geschlecht</label>
    <select id="geschlecht"><option value="m">männlich</option><option value="w">weiblich</option></select></div>
  <div class="feld"><label for="gewicht">Gewicht (kg)</label>
    <input id="gewicht" type="number" min="35" max="250" step="1" placeholder="z. B. 80"></div>
  <div class="feld"><label for="bier">Bier 0,5 l (Anzahl)</label>
    <input id="bier" type="number" min="0" max="30" step="1" value="0"></div>
  <div class="feld"><label for="wein">Wein 0,2 l (Anzahl)</label>
    <input id="wein" type="number" min="0" max="30" step="1" value="0"></div>
  <div class="feld"><label for="sekt">Sekt 0,1 l (Anzahl)</label>
    <input id="sekt" type="number" min="0" max="30" step="1" value="0"></div>
  <div class="feld"><label for="schnaps">Schnaps 4 cl (Anzahl)</label>
    <input id="schnaps" type="number" min="0" max="30" step="1" value="0"></div>
</div>`,
  script: `
function berechnen(){
  var g=$('geschlecht').value, kg=n('gewicht');
  var bier=n('bier')||0, wein=n('wein')||0, sekt=n('sekt')||0, schnaps=n('schnaps')||0;
  if(!(kg>30)) return warten();
  /* Alkoholgramm = Volumen (ml) × Vol.-% × 0,8 (Dichte) */
  var gramm=bier*500*0.05*0.8 + wein*200*0.12*0.8 + sekt*100*0.11*0.8 + schnaps*40*0.40*0.8;
  if(gramm<=0) return warten();
  var r=(g==='m')?0.68:0.55;
  var promille=gramm/(kg*r);
  var stunden=promille/0.1; /* konservativ: 0,1 ‰ Abbau pro Stunde */
  zeigen('<p>Geschätzter maximaler Blutalkohol:</p><p class="gross">'+fmt(promille,2)+' ‰</p>'+
    '<table><tr><td>Reiner Alkohol</td><td>'+fmt(gramm,0)+' g</td></tr>'+
    '<tr><td>Grobe Abbauzeit bis 0,0 ‰</td><td>ca. '+fmt(stunden,0)+'–'+fmt(promille/0.2*2,0)+' Std.</td></tr></table>'+
    '<p class="hint" style="color:var(--rot);font-weight:600">Nach Alkohol gilt: nicht fahren – unabhängig vom errechneten Wert. Individuelle Werte können deutlich abweichen.</p>');
}`,
  content: `
<h2>Wie die Schätzung funktioniert</h2>
<p>Die Widmark-Formel teilt den aufgenommenen Alkohol (in Gramm) durch das Körpergewicht
mal einem Verteilungsfaktor (ca. 0,68 bei Männern, 0,55 bei Frauen, da Alkohol sich nur
im Körperwasser verteilt). Sie liefert den theoretischen Maximalwert – real liegt der
Wert oft 10–30 % darunter, weil ein Teil des Alkohols schon bei der Aufnahme abgebaut
wird. Mageninhalt, Trinkgeschwindigkeit, Medikamente und Tagesform verändern das Ergebnis
erheblich.</p>
<h2>Promillegrenzen in Deutschland</h2>
<ul>
<li><b>0,0 ‰</b> für Fahranfänger in der Probezeit und unter 21 Jahren</li>
<li><b>ab 0,3 ‰</b> Straftat möglich, wenn Ausfallerscheinungen oder ein Unfall dazukommen</li>
<li><b>ab 0,5 ‰</b> Ordnungswidrigkeit: mind. 500 € Bußgeld, 1 Monat Fahrverbot, 2 Punkte</li>
<li><b>ab 1,1 ‰</b> absolute Fahruntüchtigkeit – Straftat, Führerscheinentzug, MPU möglich</li>
</ul>
<p>Der Abbau lässt sich nicht beschleunigen – weder durch Kaffee noch durch Schlaf oder
kalte Duschen. Die Leber schafft konstant etwa 0,1–0,15 ‰ pro Stunde. Achtung Restalkohol:
Wer bis 3 Uhr feiert, ist am Morgen oft noch nicht nüchtern.</p>`,
  faq: [
    { q: 'Wie viel Promille hat man nach einem Bier?',
      a: 'Ein 0,5-l-Bier (5 %) enthält etwa 20 g Alkohol. Bei einem 80-kg-Mann ergibt das rechnerisch rund 0,37 ‰, bei einer 60-kg-Frau rund 0,6 ‰ – ein einziges Bier kann also bereits über die 0,5-‰-Grenze führen.' },
    { q: 'Wie lange dauert der Abbau von 1 Promille?',
      a: 'Bei 0,1–0,15 ‰ pro Stunde etwa 7 bis 10 Stunden. Wer um Mitternacht 1 ‰ hat, kann morgens um 7 Uhr noch deutlich Restalkohol im Blut haben.' },
    { q: 'Warum vertragen Frauen im Schnitt weniger Alkohol?',
      a: 'Frauen haben durchschnittlich einen geringeren Körperwasseranteil, in dem sich der Alkohol verteilt. Dieselbe Trinkmenge führt daher bei gleichem Gewicht zu einem höheren Promillewert.' }
  ],
  disclaimer: 'Theoretische Schätzung nach Widmark – individuelle Werte weichen stark ab. Niemals als Grundlage für die Entscheidung nutzen, ein Fahrzeug zu führen. Nach Alkoholkonsum gilt: stehen lassen.'
};
