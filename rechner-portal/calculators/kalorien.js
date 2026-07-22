module.exports = {
  slug: 'kalorienbedarf-rechner',
  title: 'Kalorienbedarf-Rechner',
  teaser: 'Grundumsatz und Tagesbedarf – plus Werte fürs Abnehmen.',
  h1: 'Kalorienbedarf-Rechner – Grundumsatz & Gesamtumsatz berechnen',
  metaTitle: 'Kalorienbedarf berechnen – Grundumsatz & Gesamtumsatz pro Tag',
  metaDesc: 'Wie viele Kalorien brauchst du täglich? Berechne Grundumsatz und Gesamtumsatz nach der Mifflin-St-Jeor-Formel – mit Richtwerten zum Abnehmen und Zunehmen.',
  category: 'gesundheit',
  intro: `<p>Dieser Rechner ermittelt deinen Grundumsatz (Kalorienverbrauch in völliger
Ruhe) und deinen Gesamtumsatz (inklusive Aktivität) nach der wissenschaftlich etablierten
Mifflin-St-Jeor-Formel – dazu Richtwerte für Abnehmen und Zunehmen.</p>`,
  form: `
<div class="zeile">
  <div class="feld"><label for="geschlecht">Geschlecht</label>
    <select id="geschlecht"><option value="m">männlich</option><option value="w">weiblich</option></select></div>
  <div class="feld"><label for="alter">Alter (Jahre)</label>
    <input id="alter" type="number" min="15" max="100" step="1" placeholder="z. B. 35"></div>
  <div class="feld"><label for="groesse">Größe (cm)</label>
    <input id="groesse" type="number" min="120" max="230" step="1" placeholder="z. B. 175"></div>
  <div class="feld"><label for="gewicht">Gewicht (kg)</label>
    <input id="gewicht" type="number" min="30" max="300" step="0.5" placeholder="z. B. 72"></div>
</div>
<div class="feld"><label for="aktiv">Aktivitätslevel</label>
  <select id="aktiv">
    <option value="1.2">Sitzend, kaum Bewegung (Büro, wenig Sport)</option>
    <option value="1.375">Leicht aktiv (1–3× Sport pro Woche)</option>
    <option value="1.55" selected>Mäßig aktiv (3–5× Sport pro Woche)</option>
    <option value="1.725">Sehr aktiv (6–7× Sport oder körperliche Arbeit)</option>
    <option value="1.9">Extrem aktiv (Leistungssport, schwere Arbeit)</option>
  </select></div>`,
  script: `
function berechnen(){
  var g=$('geschlecht').value, alter=n('alter'), cm=n('groesse'), kg=n('gewicht'), pal=n('aktiv');
  if(!(alter>0)||!(cm>0)||!(kg>0)) return warten();
  var grund=10*kg+6.25*cm-5*alter+(g==='m'?5:-161);
  var gesamt=grund*pal;
  zeigen('<table>'+
    '<tr><td>Grundumsatz (Ruhe)</td><td>'+fmt(grund,0)+' kcal/Tag</td></tr>'+
    '<tr class="summe"><td>Gesamtumsatz (Erhaltung)</td><td><span class="gross">'+fmt(gesamt,0)+' kcal/Tag</span></td></tr>'+
    '<tr><td>Zum Abnehmen (−0,25 bis −0,5 kg/Woche)</td><td>'+fmt(gesamt-500,0)+' – '+fmt(gesamt-250,0)+' kcal</td></tr>'+
    '<tr><td>Zum Zunehmen (Muskelaufbau)</td><td>'+fmt(gesamt+200,0)+' – '+fmt(gesamt+400,0)+' kcal</td></tr>'+
    '</table><p class="hint">Berechnung nach Mifflin-St Jeor; individuelle Abweichungen von ±10 % sind normal.</p>');
}`,
  content: `
<h2>Grundumsatz und Gesamtumsatz</h2>
<p>Der <b>Grundumsatz</b> ist die Energie, die dein Körper in völliger Ruhe für Atmung,
Herzschlag, Gehirn und Körpertemperatur verbraucht – bei den meisten Erwachsenen 1.200
bis 2.000 kcal pro Tag. Der <b>Gesamtumsatz</b> multipliziert den Grundumsatz mit deinem
Aktivitätsfaktor (PAL-Wert) und beschreibt, wie viel du essen kannst, ohne zu- oder
abzunehmen.</p>
<h2>Kaloriendefizit: Weniger ist nicht mehr</h2>
<p>Fürs Abnehmen gilt ein moderates Defizit von 250–500 kcal pro Tag als nachhaltig –
das entspricht etwa 0,25–0,5 kg Fettverlust pro Woche. Radikaldiäten deutlich unterhalb
des Grundumsatzes führen oft zu Muskelabbau, Heißhunger und Jojo-Effekt. Wichtiger als
Perfektion ist die langfristige Bilanz über Wochen.</p>`,
  faq: [
    { q: 'Wie genau ist die Mifflin-St-Jeor-Formel?',
      a: 'Sie gilt als eine der genauesten Alltagsformeln und trifft den gemessenen Ruheumsatz bei den meisten Menschen auf etwa ±10 %. Individuelle Faktoren wie Muskelmasse und Genetik kann keine Formel vollständig abbilden.' },
    { q: 'Warum nehme ich trotz Kaloriendefizit nicht ab?',
      a: 'Häufigste Ursachen: unterschätzte Kalorienzufuhr (Snacks, Getränke, Öl), überschätzte Aktivität und kurzfristige Wassereinlagerungen, die den Fettverlust auf der Waage verdecken. Über 3–4 Wochen gemittelt zeigt sich die Tendenz meist verlässlich.' },
    { q: 'Sinkt der Kalorienbedarf im Alter?',
      a: 'Ja, pro Lebensjahrzehnt um grob 100–150 kcal täglich – vor allem durch abnehmende Muskelmasse und weniger Aktivität. Krafttraining wirkt dem entgegen.' }
  ],
  disclaimer: 'Richtwerte, keine medizinische oder Ernährungsberatung. Bei Erkrankungen, Schwangerschaft oder Essstörungen bitte ärztlichen Rat einholen.'
};
