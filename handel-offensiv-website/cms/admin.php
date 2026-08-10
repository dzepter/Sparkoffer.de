<?php
/**
 * HANDEL OFFENSIV – Redaktion
 * Einfacher Textredakteur für die Website (keine HTML-Kenntnisse nötig).
 *
 * Aufruf:   https://www.handel-offensiv.de/cms/admin.php
 * Speichert nach: cms/content.json  (muss für PHP beschreibbar sein)
 * Passwort: wird beim ersten Aufruf festgelegt (Hash in cms/passwort.php)
 *
 * Sicherheit: Session-Login, CSRF-Token, Bremse gegen Passwort-Raten,
 * gespeicherte Texte werden auf harmlose Auszeichnung reduziert
 * (<span class="accent">, <mark>, <strong>, <em>, <br>).
 */

declare(strict_types=1);
session_start();

const CONTENT_DATEI  = __DIR__ . '/content.json';
const PASSWORT_DATEI = __DIR__ . '/passwort.php';

/* Editierbare Felder: Schlüssel => [Gruppe, Beschriftung, mehrzeilig?] */
const FELDER = [
  'hero_kicker'      => ['Startbereich', 'Kleine Zeile über der Überschrift', false],
  'hero_titel'       => ['Startbereich', 'Große Überschrift (blauer Teil: <span class="accent">…</span>)', true],
  'hero_text'        => ['Startbereich', 'Einleitungstext', true],
  'leitgedanke_1'    => ['Leitgedanken', 'Leitgedanke 1', false],
  'leitgedanke_2'    => ['Leitgedanken', 'Leitgedanke 2', false],
  'leitgedanke_3'    => ['Leitgedanken', 'Leitgedanke 3', false],
  'programm_titel'   => ['Das Programm', 'Überschrift', false],
  'programm_text'    => ['Das Programm', 'Einleitungstext', true],
  'tag1_titel'       => ['Offensivtag 1', 'Titel', false],
  'tag1_text'        => ['Offensivtag 1', 'Beschreibung', true],
  'tag2_titel'       => ['Offensivtag 2', 'Titel', false],
  'tag2_text'        => ['Offensivtag 2', 'Beschreibung', true],
  'tag3_titel'       => ['Offensivtag 3', 'Titel', false],
  'tag3_text'        => ['Offensivtag 3', 'Beschreibung', true],
  'tag4_titel'       => ['Offensivtag 4', 'Titel', false],
  'tag4_text'        => ['Offensivtag 4', 'Beschreibung', true],
  'tag5_titel'       => ['Offensivtag 5', 'Titel', false],
  'tag5_text'        => ['Offensivtag 5', 'Beschreibung', true],
  'lernmodell_titel' => ['Lernmodell', 'Überschrift', false],
  'lernmodell_text'  => ['Lernmodell', 'Einleitungstext', true],
  'trainer_text1'    => ['Der Trainer', 'Vorstellungstext Rainer Aigner', true],
  'claim_band'       => ['Zitat-Band', 'Zitat (hervorgehobener Teil: <mark>…</mark>)', false],
  'cta_titel'        => ['Abschluss', 'Aufforderung am Seitenende', false],
];

/* ---------- Hilfsfunktionen ---------- */

function csrf_token(): string {
  if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
  return $_SESSION['csrf'];
}

function csrf_pruefen(): bool {
  return isset($_POST['csrf']) && hash_equals($_SESSION['csrf'] ?? '', (string)$_POST['csrf']);
}

function eingeloggt(): bool {
  return !empty($_SESSION['redaktion_ok']);
}

function text_bereinigen(string $wert): string {
  // Nur harmlose Auszeichnung zulassen, alle Attribute außer class="accent" entfernen
  $wert = strip_tags($wert, '<span><mark><strong><em><br>');
  $wert = preg_replace('/<span\b(?![^>]*class="accent")[^>]*>/i', '<span class="accent">', $wert);
  $wert = preg_replace('/<span\b[^>]*class="accent"[^>]*>/i', '<span class="accent">', $wert);
  $wert = preg_replace('/<(mark|strong|em|br)\b[^>]*>/i', '<$1>', $wert);
  return trim($wert);
}

function inhalte_laden(): array {
  if (!is_file(CONTENT_DATEI)) return [];
  $daten = json_decode((string)file_get_contents(CONTENT_DATEI), true);
  return is_array($daten) ? $daten : [];
}

function inhalte_speichern(array $daten): bool {
  $json = json_encode($daten, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  return file_put_contents(CONTENT_DATEI, $json, LOCK_EX) !== false;
}

/* ---------- Aktionen ---------- */

$meldung = null; $fehler = null;

// Abmelden
if (isset($_GET['abmelden'])) {
  session_destroy();
  header('Location: admin.php'); exit;
}

// Erstes Passwort festlegen
if (!is_file(PASSWORT_DATEI) && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['neues_passwort'])) {
  $p1 = (string)($_POST['neues_passwort'] ?? '');
  $p2 = (string)($_POST['neues_passwort2'] ?? '');
  if (strlen($p1) < 10)      $fehler = 'Das Passwort muss mindestens 10 Zeichen lang sein.';
  elseif ($p1 !== $p2)       $fehler = 'Die beiden Passwörter stimmen nicht überein.';
  else {
    $hash = password_hash($p1, PASSWORD_DEFAULT);
    $ok = file_put_contents(PASSWORT_DATEI, "<?php\nreturn " . var_export($hash, true) . ";\n", LOCK_EX);
    if ($ok === false) $fehler = 'Das Passwort konnte nicht gespeichert werden. Bitte prüfen Sie die Schreibrechte des Ordners cms/.';
    else { $_SESSION['redaktion_ok'] = true; session_regenerate_id(true); $meldung = 'Passwort festgelegt – Sie sind angemeldet.'; }
  }
}

// Anmelden
if (is_file(PASSWORT_DATEI) && !eingeloggt() && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['passwort'])) {
  $_SESSION['versuche'] = ($_SESSION['versuche'] ?? 0) + 1;
  if ($_SESSION['versuche'] > 5) sleep(3); // Bremse gegen Durchprobieren
  $hash = require PASSWORT_DATEI;
  if (password_verify((string)$_POST['passwort'], (string)$hash)) {
    $_SESSION['redaktion_ok'] = true;
    $_SESSION['versuche'] = 0;
    session_regenerate_id(true);
  } else {
    $fehler = 'Das Passwort ist nicht korrekt.';
  }
}

// Speichern
if (eingeloggt() && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['speichern'])) {
  if (!csrf_pruefen()) {
    $fehler = 'Die Sitzung ist abgelaufen. Bitte laden Sie die Seite neu und versuchen Sie es noch einmal.';
  } else {
    $inhalte = inhalte_laden();
    foreach (FELDER as $schluessel => $_def) {
      if (isset($_POST['feld'][$schluessel])) {
        $inhalte[$schluessel] = text_bereinigen((string)$_POST['feld'][$schluessel]);
      }
    }
    if (inhalte_speichern($inhalte)) $meldung = 'Gespeichert! Die Website zeigt die neuen Texte sofort.';
    else $fehler = 'Speichern fehlgeschlagen. Bitte prüfen Sie die Schreibrechte der Datei cms/content.json.';
  }
}

$inhalte = inhalte_laden();
?>
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Redaktion – HANDEL OFFENSIV</title>
<style>
  :root { --blau:#2e6fb0; --blauhell:#7fb8e8; --navy:#101c2a; --papier:#f5f7f9; --tinte:#131a22; --linie:#dee4ea; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Archivo, "Helvetica Neue", Arial, sans-serif; background: var(--papier); color: var(--tinte); font-size:16px; line-height:1.55; }
  header { background: var(--navy); color:#fff; padding:18px 24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; }
  header .marke { font-weight:800; text-transform:uppercase; letter-spacing:.02em; }
  header .marke em { font-style:normal; color: var(--blauhell); }
  header a { color:#cfe2f5; font-size:.9rem; text-decoration:none; margin-left:16px; }
  header a:hover { color:#fff; }
  main { max-width: 860px; margin: 0 auto; padding: 28px 20px 80px; }
  h1 { font-size:1.5rem; text-transform:uppercase; margin: 8px 0 4px; }
  .hinweis { color:#44505e; font-size:.95rem; margin-bottom: 22px; }
  .box { background:#fff; border:1px solid var(--linie); border-radius:2px; padding:22px; margin-bottom:18px; }
  .box h2 { font-size:.8rem; text-transform:uppercase; letter-spacing:.14em; color:var(--blau); margin-bottom:14px; }
  label { display:block; font-size:.8rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#44505e; margin:14px 0 6px; }
  input[type=text], input[type=password], textarea { width:100%; padding:12px 14px; font:inherit; border:1px solid var(--linie); border-radius:2px; background:#fff; }
  textarea { min-height:88px; resize:vertical; }
  input:focus, textarea:focus { outline:none; border-color:var(--blau); box-shadow:0 0 0 3px rgba(46,111,176,.2); }
  .knopf { display:inline-block; background:var(--blau); color:#fff; border:0; padding:14px 26px; font:inherit; font-weight:700; letter-spacing:.1em; text-transform:uppercase; font-size:.85rem; border-radius:2px; cursor:pointer; }
  .knopf:hover { background:#25588c; }
  .meldung { background:#e7f2e7; border:1px solid #bcd8bc; color:#2c5a2c; padding:12px 16px; border-radius:2px; margin-bottom:18px; }
  .fehler { background:#f7e8e6; border:1px solid #e3bdb8; color:#8a2f24; padding:12px 16px; border-radius:2px; margin-bottom:18px; }
  .tipp { font-size:.85rem; color:#44505e; margin-top:6px; }
  .speicherleiste { position:sticky; bottom:0; background:var(--papier); padding:14px 0; border-top:1px solid var(--linie); }
</style>
</head>
<body>
<header>
  <span class="marke">Handel <em>Offensiv</em> · Redaktion</span>
  <span>
    <a href="../index.html" target="_blank" rel="noopener">Website ansehen ↗</a>
    <?php if (eingeloggt()): ?><a href="admin.php?abmelden=1">Abmelden</a><?php endif; ?>
  </span>
</header>
<main>

<?php if ($meldung): ?><div class="meldung"><?= htmlspecialchars($meldung) ?></div><?php endif; ?>
<?php if ($fehler): ?><div class="fehler"><?= htmlspecialchars($fehler) ?></div><?php endif; ?>

<?php if (!is_file(PASSWORT_DATEI)): ?>

  <h1>Willkommen!</h1>
  <p class="hinweis">Bevor es losgeht: Legen Sie einmalig Ihr Redaktions-Passwort fest. Merken Sie es sich gut – damit ändern Sie künftig alle Texte der Website.</p>
  <form method="post" class="box">
    <h2>Passwort festlegen</h2>
    <label for="np">Neues Passwort (mindestens 10 Zeichen)</label>
    <input type="password" id="np" name="neues_passwort" required minlength="10" autocomplete="new-password">
    <label for="np2">Passwort wiederholen</label>
    <input type="password" id="np2" name="neues_passwort2" required minlength="10" autocomplete="new-password">
    <p style="margin-top:18px"><button class="knopf" type="submit">Passwort speichern</button></p>
  </form>

<?php elseif (!eingeloggt()): ?>

  <h1>Anmelden</h1>
  <p class="hinweis">Hier ändern Sie die Texte der Website – ganz ohne Technik.</p>
  <form method="post" class="box">
    <h2>Redaktions-Login</h2>
    <label for="pw">Passwort</label>
    <input type="password" id="pw" name="passwort" required autocomplete="current-password">
    <p style="margin-top:18px"><button class="knopf" type="submit">Anmelden</button></p>
  </form>

<?php else: ?>

  <h1>Texte bearbeiten</h1>
  <p class="hinweis">Ändern Sie die Texte und klicken Sie unten auf „Alles speichern“ – die Website zeigt die neuen Texte sofort. <br>Tipp: Text zwischen <code>&lt;span class="accent"&gt;</code> und <code>&lt;/span&gt;</code> erscheint <strong style="color:var(--blau)">blau</strong>.</p>

  <form method="post">
    <input type="hidden" name="csrf" value="<?= htmlspecialchars(csrf_token()) ?>">
    <?php
      $gruppen = [];
      foreach (FELDER as $schluessel => [$gruppe, $beschriftung, $mehrzeilig]) {
        $gruppen[$gruppe][] = [$schluessel, $beschriftung, $mehrzeilig];
      }
      foreach ($gruppen as $gruppe => $felder): ?>
        <div class="box">
          <h2><?= htmlspecialchars($gruppe) ?></h2>
          <?php foreach ($felder as [$schluessel, $beschriftung, $mehrzeilig]):
            $wert = (string)($inhalte[$schluessel] ?? ''); ?>
            <label for="f_<?= $schluessel ?>"><?= htmlspecialchars($beschriftung) ?></label>
            <?php if ($mehrzeilig): ?>
              <textarea id="f_<?= $schluessel ?>" name="feld[<?= $schluessel ?>]"><?= htmlspecialchars($wert) ?></textarea>
            <?php else: ?>
              <input type="text" id="f_<?= $schluessel ?>" name="feld[<?= $schluessel ?>]" value="<?= htmlspecialchars($wert) ?>">
            <?php endif; ?>
          <?php endforeach; ?>
        </div>
      <?php endforeach; ?>
    <div class="speicherleiste">
      <button class="knopf" type="submit" name="speichern" value="1">Alles speichern</button>
    </div>
  </form>

<?php endif; ?>

</main>
</body>
</html>
