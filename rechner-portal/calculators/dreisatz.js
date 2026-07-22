module.exports = {
  slug: 'dreisatz-rechner',
  title: 'Dreisatz-Rechner',
  teaser: 'Proportionale und antiproportionale Zuordnungen lösen.',
  h1: 'Dreisatz-Rechner – Dreisatz online lösen',
  metaTitle: 'Dreisatz-Rechner – proportional & antiproportional mit Rechenweg',
  metaDesc: 'Dreisatz einfach lösen: 3 Äpfel kosten 2 € – was kosten 7? Rechner für proportionale und antiproportionale Zuordnungen mit Rechenweg.',
  category: 'alltag',
  intro: `<p>Der Klassiker aus der Schule, den man ständig braucht: „3 kg kosten 5,40 € –
was kosten 5 kg?“ Gib die drei bekannten Werte ein; der Rechner löst den Dreisatz und
zeigt den Rechenweg – wahlweise proportional oder antiproportional.</p>`,
  form: `
<div class="feld"><label for="art">Art der Zuordnung</label>
  <select id="art"><option value="pro">proportional (mehr → mehr, z. B. Menge und Preis)</option>
  <option value="anti">antiproportional (mehr → weniger, z. B. Arbeiter und Dauer)</option></select></div>
<div class="zeile">
  <div class="feld"><label for="a1">Ausgangswert A (z. B. 3 kg)</label>
    <input id="a1" type="number" step="0.01" placeholder="3"></div>
  <div class="feld"><label for="b1">zugehöriger Wert B (z. B. 5,40 €)</label>
    <input id="b1" type="number" step="0.01" placeholder="5,40"></div>
  <div class="feld"><label for="a2">Neuer Wert A (z. B. 5 kg)</label>
    <input id="a2" type="number" step="0.01" placeholder="5"></div>
</div>`,
  script: `
function berechnen(){
  var art=$('art').value, a1=n('a1'), b1=n('b1'), a2=n('a2');
  if(isNaN(a1)||isNaN(b1)||isNaN(a2)||a1===0||(art==='anti'&&a2===0)) return warten();
  var x, weg;
  if(art==='pro'){
    x=b1/a1*a2;
    weg=fmt(a1)+' → '+fmt(b1)+'<br>1 → '+fmt(b1)+' ÷ '+fmt(a1)+' = '+fmt(b1/a1,4)+'<br>'+fmt(a2)+' → '+fmt(b1/a1,4)+' × '+fmt(a2)+' = <b>'+fmt(x)+'</b>';
  } else {
    x=b1*a1/a2;
    weg=fmt(a1)+' → '+fmt(b1)+'<br>1 → '+fmt(b1)+' × '+fmt(a1)+' = '+fmt(b1*a1,4)+'<br>'+fmt(a2)+' → '+fmt(b1*a1,4)+' ÷ '+fmt(a2)+' = <b>'+fmt(x)+'</b>';
  }
  zeigen('<p>Gesuchter Wert:</p><p class="gross">'+fmt(x)+'</p><p class="hint">Rechenweg über den Einheitswert:<br>'+weg+'</p>');
}`,
  content: `
<h2>Proportional oder antiproportional?</h2>
<p>Beim <b>proportionalen</b> Dreisatz wachsen beide Größen gemeinsam: doppelte Menge,
doppelter Preis (Einkauf, Rezepte umrechnen, Tempo und Strecke). Beim
<b>antiproportionalen</b> Dreisatz gilt das Gegenteil: doppelt so viele Maler brauchen
die halbe Zeit (Arbeitskräfte und Dauer, Geschwindigkeit und Fahrzeit, Futtervorrat und
Tiere). Der schnelle Test: Frag dich, ob „mehr von A“ zu „mehr von B“ führt (proportional)
oder zu „weniger von B“ (antiproportional).</p>
<h2>Der Weg über die Einheit</h2>
<p>Der Dreisatz funktioniert immer über den Zwischenschritt „Wert für 1“: Erst auf eine
Einheit herunterrechnen (÷ beim proportionalen, × beim antiproportionalen), dann auf die
gesuchte Menge hochrechnen. Genau diesen Rechenweg zeigt der Rechner an – ideal auch zum
Nachvollziehen für Hausaufgaben.</p>`,
  faq: [
    { q: 'Wo braucht man den Dreisatz im Alltag?',
      a: 'Ständig: Preise pro Kilo vergleichen, Rezepte von 4 auf 6 Personen umrechnen, Spritverbrauch hochrechnen, Währungen überschlagen oder Arbeitszeiten kalkulieren.' },
    { q: 'Was ist der Unterschied zum „Zweisatz“?',
      a: 'Der Zwischenschritt über die Einheit („1 kg kostet …“) wird manchmal Zweisatz genannt. Der Dreisatz ergänzt den dritten Schritt: von der Einheit auf die gesuchte Menge.' },
    { q: 'Funktioniert der Dreisatz immer?',
      a: 'Nur wenn die Größen wirklich (anti)proportional zusammenhängen. Mengenrabatte, Staffelpreise oder Fixkosten brechen die Proportionalität – dann liefert der Dreisatz falsche Ergebnisse.' }
  ]
};
