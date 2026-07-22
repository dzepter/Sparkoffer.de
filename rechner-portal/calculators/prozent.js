module.exports = {
  slug: 'prozentrechner',
  title: 'Prozentrechner',
  teaser: 'Prozentwert, Prozentsatz und prozentuale Änderung berechnen.',
  h1: 'Prozentrechner – Prozente einfach online berechnen',
  metaTitle: 'Prozentrechner – Prozentwert, Prozentsatz & Änderung berechnen',
  metaDesc: 'Wie viel sind X % von Y? Wie viel Prozent ist A von B? Prozentuale Zu- oder Abnahme? Der kostenlose Prozentrechner für alle drei Aufgaben.',
  category: 'finanzen',
  intro: `<p>Die drei klassischen Prozentaufgaben in einem Rechner: Prozentwert („Wie viel
sind 15 % von 80?“), Prozentsatz („Wie viel Prozent sind 12 von 60?“) und prozentuale
Veränderung („Von 250 auf 310 – wie viel Prozent mehr?“).</p>`,
  form: `
<div class="feld"><label for="modus">Aufgabe wählen</label>
  <select id="modus">
    <option value="wert">Wie viel sind X % von Y?</option>
    <option value="satz">Wie viel Prozent ist A von B?</option>
    <option value="aend">Prozentuale Änderung von A nach B</option>
  </select></div>
<div class="zeile">
  <div class="feld"><label for="a" id="aLabel">Prozentsatz X (%)</label>
    <input id="a" type="number" step="0.01" placeholder="z. B. 15"></div>
  <div class="feld"><label for="b" id="bLabel">Grundwert Y</label>
    <input id="b" type="number" step="0.01" placeholder="z. B. 80"></div>
</div>`,
  script: `
var LBL={wert:['Prozentsatz X (%)','Grundwert Y'],satz:['Teilwert A','Grundwert B'],aend:['Startwert A','Endwert B']};
function berechnen(){
  var m=$('modus').value, a=n('a'), b=n('b');
  $('aLabel').textContent=LBL[m][0]; $('bLabel').textContent=LBL[m][1];
  if(isNaN(a)||isNaN(b)) return warten();
  if(m==='wert'){
    zeigen('<p>'+fmt(a)+' % von '+fmt(b)+' sind</p><p class="gross">'+fmt(a/100*b)+'</p>');
  } else if(m==='satz'){
    if(b===0) return warten();
    zeigen('<p>'+fmt(a)+' von '+fmt(b)+' sind</p><p class="gross">'+fmt(a/b*100)+' %</p>');
  } else {
    if(a===0) return warten();
    var p=(b-a)/Math.abs(a)*100;
    zeigen('<p>Von '+fmt(a)+' auf '+fmt(b)+' ist eine Änderung von</p>'+
      '<p class="gross">'+(p>=0?'+':'')+fmt(p)+' %</p>'+
      '<p class="hint">Absolute Differenz: '+(b-a>=0?'+':'')+fmt(b-a)+'</p>');
  }
}`,
  content: `
<h2>Die Grundformel der Prozentrechnung</h2>
<p>Alle Prozentaufgaben beruhen auf einer Beziehung: <b>Prozentwert = Grundwert ×
Prozentsatz ÷ 100</b>. Je nachdem, welche zwei Größen bekannt sind, wird nach der dritten
umgestellt:</p>
<ul>
<li>Prozentwert: W = G × p ÷ 100 → 15 % von 80 = 12</li>
<li>Prozentsatz: p = W ÷ G × 100 → 12 von 60 = 20 %</li>
<li>Grundwert: G = W ÷ p × 100 → 12 sind 15 %, also G = 80</li>
</ul>
<h2>Typische Stolperfalle: Prozentpunkte</h2>
<p>Steigt ein Zinssatz von 2 % auf 3 %, sind das <b>1 Prozentpunkt</b> Unterschied – aber
eine Steigerung um <b>50 Prozent</b> (denn 3 ist das 1,5-Fache von 2). Bei Vergleichen von
Prozentangaben lohnt sich also ein zweiter Blick, was gemeint ist.</p>`,
  faq: [
    { q: 'Wie rechne ich schnell Prozente im Kopf?',
      a: 'Über den 10-%-Trick: 10 % erhältst du, indem du das Komma um eine Stelle verschiebst. 15 % von 80 = 10 % (8) + die Hälfte davon (4) = 12. Auch praktisch: x % von y ist dasselbe wie y % von x – 8 % von 50 = 50 % von 8 = 4.' },
    { q: 'Warum ist erst −50 % und dann +50 % nicht wieder der Anfangswert?',
      a: 'Weil sich die zweite Prozentangabe auf den neuen, kleineren Grundwert bezieht: 100 → 50 (−50 %) → 75 (+50 % von 50). Um eine Halbierung auszugleichen, braucht es +100 %.' },
    { q: 'Was bedeutet eine Änderung von mehr als 100 %?',
      a: 'Der Wert hat sich mehr als verdoppelt. +150 % heißt: Der Endwert ist das 2,5-Fache des Startwerts (Startwert + 1,5 × Startwert).' }
  ]
};
