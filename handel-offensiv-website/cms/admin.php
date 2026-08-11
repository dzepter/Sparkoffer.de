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
  'hero_kicker' => ['Startseite · Kopfbereich', 'Kleine Zeile über der Überschrift', false],
  'hero_titel' => ['Startseite · Kopfbereich', 'Große Überschrift (blauer Teil: <span class="accent">…</span>)', true],
  'hero_text' => ['Startseite · Kopfbereich', 'Einleitungstext', true],
  'leitgedanke_1' => ['Startseite · Leitgedanken', 'Leitgedanke 1', false],
  'leitgedanke_2' => ['Startseite · Leitgedanken', 'Leitgedanke 2', false],
  'leitgedanke_3' => ['Startseite · Leitgedanken', 'Leitgedanke 3', false],
  'programm_titel' => ['Startseite · Programm-Einleitung', 'Überschrift', false],
  'programm_text' => ['Startseite · Programm-Einleitung', 'Einleitungstext', true],
  'tag1_titel' => ['Startseite · Offensivtag 1', 'Titel', false],
  'tag1_text' => ['Startseite · Offensivtag 1', 'Beschreibung', true],
  'tag2_titel' => ['Startseite · Offensivtag 2', 'Titel', false],
  'tag2_text' => ['Startseite · Offensivtag 2', 'Beschreibung', true],
  'tag3_titel' => ['Startseite · Offensivtag 3', 'Titel', false],
  'tag3_text' => ['Startseite · Offensivtag 3', 'Beschreibung', true],
  'tag4_titel' => ['Startseite · Offensivtag 4', 'Titel', false],
  'tag4_text' => ['Startseite · Offensivtag 4', 'Beschreibung', true],
  'tag5_titel' => ['Startseite · Offensivtag 5', 'Titel', false],
  'tag5_text' => ['Startseite · Offensivtag 5', 'Beschreibung', true],
  'lernmodell_titel' => ['Startseite · Lernmodell', 'Überschrift', false],
  'lernmodell_text' => ['Startseite · Lernmodell', 'Einleitungstext', true],
  'zyklus1_titel' => ['Startseite · Lernzyklus', 'Schritt 1 · Vorbereiten – Titel', false],
  'zyklus1_text' => ['Startseite · Lernzyklus', 'Schritt 1 · Vorbereiten – Text', true],
  'zyklus2_titel' => ['Startseite · Lernzyklus', 'Schritt 2 · Erleben – Titel', false],
  'zyklus2_text' => ['Startseite · Lernzyklus', 'Schritt 2 · Erleben – Text', true],
  'zyklus3_titel' => ['Startseite · Lernzyklus', 'Schritt 3 · Vertiefen – Titel', false],
  'zyklus3_text' => ['Startseite · Lernzyklus', 'Schritt 3 · Vertiefen – Text', true],
  'zyklus4_titel' => ['Startseite · Lernzyklus', 'Schritt 4 · Umsetzen – Titel', false],
  'zyklus4_text' => ['Startseite · Lernzyklus', 'Schritt 4 · Umsetzen – Text', true],
  'zyklus5_titel' => ['Startseite · Lernzyklus', 'Schritt 5 · Reflektieren – Titel', false],
  'zyklus5_text' => ['Startseite · Lernzyklus', 'Schritt 5 · Reflektieren – Text', true],
  'app_titel' => ['Startseite · Die App', 'Überschrift', false],
  'app_text' => ['Startseite · Die App', 'Einleitungstext', true],
  'app_punkt1_titel' => ['Startseite · Die App', 'Punkt 1 – Titel', false],
  'app_punkt1_text' => ['Startseite · Die App', 'Punkt 1 – Text', true],
  'app_punkt2_titel' => ['Startseite · Die App', 'Punkt 2 – Titel', false],
  'app_punkt2_text' => ['Startseite · Die App', 'Punkt 2 – Text', true],
  'app_punkt3_titel' => ['Startseite · Die App', 'Punkt 3 – Titel', false],
  'app_punkt3_text' => ['Startseite · Die App', 'Punkt 3 – Text', true],
  'app_punkt4_titel' => ['Startseite · Die App', 'Punkt 4 – Titel', false],
  'app_punkt4_text' => ['Startseite · Die App', 'Punkt 4 – Text', true],
  'app_hinweis' => ['Startseite · Die App', 'Hinweiszeile unter den Punkten', true],
  'claim_band' => ['Startseite · Zitat-Band', 'Zitat (hervorgehobener Teil: <mark>…</mark>)', false],
  'claim_cite' => ['Startseite · Zitat-Band', 'Zeile unter dem Zitat', false],
  'trainer_lead' => ['Startseite · Der Trainer', 'Kurzzeile unter dem Namen', false],
  'trainer_text1' => ['Startseite · Der Trainer', 'Vorstellungstext Rainer Aigner', true],
  'trainer_prinzip' => ['Startseite · Der Trainer', 'Prinzip-Satz (fett: <strong>…</strong>)', true],
  'zielgruppe_titel' => ['Startseite · Zielgruppen', 'Überschrift', true],
  'zielgruppe1_label' => ['Startseite · Zielgruppen', 'Karte 1 – kleine Zeile', false],
  'zielgruppe1_titel' => ['Startseite · Zielgruppen', 'Karte 1 – Titel', false],
  'zielgruppe1_text' => ['Startseite · Zielgruppen', 'Karte 1 – Text', true],
  'zielgruppe2_label' => ['Startseite · Zielgruppen', 'Karte 2 – kleine Zeile', false],
  'zielgruppe2_titel' => ['Startseite · Zielgruppen', 'Karte 2 – Titel', false],
  'zielgruppe2_text' => ['Startseite · Zielgruppen', 'Karte 2 – Text', true],
  'zielgruppe3_label' => ['Startseite · Zielgruppen', 'Karte 3 – kleine Zeile', false],
  'zielgruppe3_titel' => ['Startseite · Zielgruppen', 'Karte 3 – Titel', false],
  'zielgruppe3_text' => ['Startseite · Zielgruppen', 'Karte 3 – Text', true],
  'cta_titel' => ['Startseite · Abschluss', 'Aufforderung am Seitenende', false],
  'footer_claim' => ['Startseite · Fußzeile', 'Text unter dem Logo', true],
  'footer_adresse' => ['Startseite · Fußzeile', 'Adresse (Zeilenumbruch: <br>)', true],
  'login_titel' => ['Anmelden-Seite · Einleitung', 'Überschrift', false],
  'login_text' => ['Anmelden-Seite · Einleitung', 'Einleitungstext', true],
  'login_app_titel' => ['Anmelden-Seite · Teilnehmer-Karte', 'Titel', false],
  'login_app_text' => ['Anmelden-Seite · Teilnehmer-Karte', 'Beschreibung', true],
  'login_app_schritte' => ['Anmelden-Seite · Teilnehmer-Karte', 'Die drei Schritte (Zeilenumbruch: <br>)', true],
  'login_cockpit_titel' => ['Anmelden-Seite · Cockpit-Karte', 'Titel', false],
  'login_cockpit_text' => ['Anmelden-Seite · Cockpit-Karte', 'Beschreibung', true],
  'login_claim' => ['Anmelden-Seite · Zitat', 'Zitat (hervorgehobener Teil: <mark>…</mark>)', false],
  'login_claim_text' => ['Anmelden-Seite · Zitat', 'Zeile unter dem Zitat', false],
  'kontakt_titel' => ['Kontakt-Seite', 'Überschrift', false],
  'kontakt_text' => ['Kontakt-Seite', 'Einleitungstext', true],
  'kontakt_draht' => ['Kontakt-Seite', 'Adresse & Erreichbarkeit (Links bleiben erhalten)', true],
  'kontakt_trainer' => ['Kontakt-Seite', 'Kurzvorstellung Trainer', true],
  'fehler_titel' => ['Fehlerseite (404)', 'Überschrift', false],
  'fehler_text' => ['Fehlerseite (404)', 'Text', false],
];

/* Eingebaute Standardtexte (erscheinen vorausgefüllt; leeres Feld = Standardtext) */
const VORGABEN = [
  'hero_kicker' => 'Handel Offensiv · Der Führungsführerschein für den Handel',
  'hero_titel' => 'Handel ist Mannschafts&shy;sport. <span class="accent">Führung entscheidet das Spiel.</span>',
  'hero_text' => 'Fünf Offensivtage, dazwischen Training im echten Betrieb, begleitet vom digitalen Mannschaftsraum. Am Ende steht keine Teilnahmebescheinigung – sondern eine Führungskraft, die liefert.',
  'leitgedanke_1' => 'Aus Mitarbeitern wird <span class="accent">Mannschaft.</span>',
  'leitgedanke_2' => 'Führung auf der Fläche. <span class="accent">Wirkung in den Zahlen.</span>',
  'leitgedanke_3' => 'Aus Wissen <span class="accent">Können</span> machen.',
  'programm_titel' => 'Fünf <span class="accent">Offensivtage.</span> Eine Saison.',
  'programm_text' => 'Kein Seminar-Marathon, sondern eine Entwicklungsreise: Jeder Offensivtag ist ein Spieltag – und zwischen den Spieltagen wird trainiert, wo es zählt: auf Ihrer Fläche.',
  'tag1_titel' => 'Führung beginnt bei mir',
  'tag1_text' => 'Bevor Sie eine Mannschaft führen, führen Sie sich selbst. Haltung, Wirkung, Verantwortung – das persönliche Fundament, auf dem alles Weitere aufbaut.',
  'tag2_titel' => 'Aus Mitarbeitern wird Mannschaft',
  'tag2_text' => 'Ein Dienstplan macht noch kein Team. Wie aus Einzelspielern eine Mannschaft wird, die füreinander läuft – Motivation, Vertrauen, gemeinsame Ziele.',
  'tag3_titel' => 'Die richtige Aufstellung',
  'tag3_text' => 'Kein Trainer stellt elf Stürmer auf. Stärken erkennen, Positionen besetzen, Verantwortung delegieren – Mitarbeiterführung als Aufstellungskunst.',
  'tag4_titel' => 'Spielintelligenz mit KI',
  'tag4_text' => 'KI macht alle schneller – Vorsprung hat, wer früher handelt. Wie Führungskräfte im Handel die neuen Werkzeuge klug einsetzen, statt ihnen hinterherzulaufen.',
  'tag5_titel' => 'Führen, wenn es darauf ankommt',
  'tag5_text' => 'Rückstand, Konflikt, Drucksituation – genau dann zeigt sich Führung. Der letzte Spieltag macht aus Gelerntem Gewohnheit: Ihr persönlicher 90-Tage-Offensivplan.',
  'lernmodell_titel' => 'Zwischen den Spieltagen wird <span class="accent">trainiert.</span>',
  'lernmodell_text' => 'Handel Offensiv ist kein Onlinekurs und kein Vortragszyklus. Es ist ein Trainingssystem: Was am Offensivtag erarbeitet wird, wird in den Wochen danach im eigenen Markt umgesetzt – und beim nächsten Spieltag ausgewertet.',
  'zyklus1_titel' => 'Vor dem Offensivtag',
  'zyklus1_text' => 'Kurzer Einstieg, Selbsteinschätzung, eine vorbereitende Frage – Sie kommen warmgelaufen an.',
  'zyklus2_titel' => 'Der Offensivtag',
  'zyklus2_text' => 'Ein intensiver Präsenztag mit Rainer Aigner – Praxis, Klartext, Mannschaftsgeist.',
  'zyklus3_titel' => 'Nach dem Offensivtag',
  'zyklus3_text' => 'Zusammenfassung, zentrale Erkenntnisse, kurzes Quiz – das Gelernte setzt sich fest.',
  'zyklus4_titel' => 'Auf der Fläche',
  'zyklus4_text' => 'Eine konkrete Transferaufgabe im eigenen Betrieb – z. B. ein verbindliches Feedbackgespräch.',
  'zyklus5_titel' => 'Der Offensivplan',
  'zyklus5_text' => 'Erkenntnis, Verhalten, Maßnahme, Ergebnis – dokumentiert und beim nächsten Spieltag besprochen.',
  'app_titel' => 'Die Handel-Offensiv-App',
  'app_text' => 'Zwischen den Offensivtagen sind Sie nicht allein: Die App begleitet jeden Teilnehmer – ruhig, klar und ohne Schnickschnack.',
  'app_punkt1_titel' => 'Was ist jetzt wichtig?',
  'app_punkt1_text' => 'Die App beantwortet jeden Morgen genau eine Frage: Was ist mein nächster Schritt bis zum nächsten Offensivtag?',
  'app_punkt2_titel' => 'Aufgaben &amp; Impulse',
  'app_punkt2_text' => 'Transferaufgaben, kurze Lernimpulse und Erinnerungen – zum richtigen Zeitpunkt freigeschaltet.',
  'app_punkt3_titel' => 'Der persönliche Offensivplan',
  'app_punkt3_text' => 'Erkenntnisse und Maßnahmen festhalten, Fortschritt sehen – nach Tag 5 wird daraus der 90-Tage-Offensivplan.',
  'app_punkt4_titel' => 'Trainerfeedback',
  'app_punkt4_text' => 'Was Sie teilen möchten, sieht Ihr Trainer – und antwortet persönlich. Ihre Reflexionen bleiben privat.',
  'app_hinweis' => 'Die App ist Bestandteil des Programms (iPhone, Zugang per persönlicher Einladung). Sie ersetzt die Präsenztage nicht – sie verbindet sie.',
  'claim_band' => 'Ballbesitz gewinnt keine Spiele. <mark>Tore schon.</mark>',
  'claim_cite' => 'Unternehmerisch führen mit Handel Offensiv',
  'trainer_lead' => 'Bundesliga-Profi. 16-facher Firmengründer. Führungstrainer.',
  'trainer_text1' => 'Rainer Aigner hat beides erlebt: Spitzenleistung auf dem Rasen – 1860 München, FC Bayern (Deutscher Vizemeister 1991), Fortuna Düsseldorf – und Verantwortung im Unternehmen, mit 16 Firmengründungen und über 1.000 geschaffenen Arbeitsplätzen. Heute macht er als zertifizierter Führungskräftetrainer aus Führungsskeptikern Führungspersönlichkeiten.',
  'trainer_prinzip' => 'Sein Prinzip ist einfach: <strong>Es wird nichts grundsätzlich anders – aber einiges grundsätzlich erfolgreicher.</strong>',
  'zielgruppe_titel' => 'Für alle, die im Handel <span class="accent">führen</span> – oder es werden wollen.',
  'zielgruppe1_label' => 'Aufsteiger',
  'zielgruppe1_titel' => 'Nachwuchs&shy;führungskräfte',
  'zielgruppe1_text' => 'Vom besten Verkäufer zur Führungskraft – der Führungsführerschein macht den Rollenwechsel zum System statt zum Sprung ins kalte Wasser.',
  'zielgruppe2_label' => 'Verantwortliche',
  'zielgruppe2_titel' => 'Markt- &amp; Filialleitung',
  'zielgruppe2_text' => 'Wer täglich Mannschaft, Fläche und Zahlen zusammenbringen muss, bekommt hier das Handwerkszeug – praxisnah und sofort umsetzbar.',
  'zielgruppe3_label' => 'Unternehmen',
  'zielgruppe3_titel' => 'Handels&shy;unternehmen',
  'zielgruppe3_text' => 'Führungskräfte aus den eigenen Reihen entwickeln statt teuer suchen – als Gruppe Ihres Unternehmens, begleitet über Monate statt Tage.',
  'cta_titel' => 'Bereit für die erste Saison?',
  'footer_claim' => 'Der Führungsführerschein für den Handel. Ein Programm von Aigner Offensiv, München.',
  'footer_adresse' => 'Hohenzollernstraße 76<br>80801 München',
  'login_titel' => 'Rein in die <span class="accent">Kabine.</span>',
  'login_text' => 'Handel Offensiv ist ein geschlossenes Programm – der Zugang erfolgt ausschließlich über eine persönliche Einladung. Wählen Sie Ihren Weg:',
  'login_app_titel' => 'Die Handel-Offensiv-App',
  'login_app_text' => 'Als Teilnehmerin oder Teilnehmer nutzen Sie die App auf Ihrem iPhone: Aufgaben, Lernimpulse, Ihr Offensivplan und Ihre Termine – alles an einem Ort.',
  'login_app_schritte' => '1. Sie erhalten eine persönliche Einladungs-E-Mail von Aigner Offensiv.<br>
2. Link öffnen, eigenes Passwort festlegen.<br>
3. App laden, anmelden – fertig.',
  'login_cockpit_titel' => 'Das Cockpit',
  'login_cockpit_text' => 'Trainerinnen, Trainer und die Programmverwaltung arbeiten im Web-Cockpit: Gruppen im Blick, Aufgaben mit Feedback, Inhalte und Freischaltungen verwalten.',
  'login_claim' => 'Die Kabine bleibt <mark>geschützt.</mark>',
  'login_claim_text' => 'Persönliche Reflexionen sind privat – Zugang nur auf Einladung, keine öffentliche Registrierung.',
  'kontakt_titel' => 'Holen Sie das Programm in Ihr Unternehmen.',
  'kontakt_text' => 'Handel Offensiv startet als geschlossene Gruppe Ihres Unternehmens oder als offene Gruppe. Termine, Orte und Konditionen erhalten Sie auf Anfrage – wir melden uns umgehend.',
  'kontakt_draht' => 'Aigner Offensiv<br>
Hohenzollernstraße 76, 80801 München<br>
Telefon: <a href="tel:+498933035055">089 / 33 03 50-55</a><br>
E-Mail: <a href="mailto:info@aigner-offensiv.de">info@aigner-offensiv.de</a>',
  'kontakt_trainer' => 'Rainer Aigner – Bundesliga-Profi, 16-facher Firmengründer, zertifizierter Führungskräftetrainer.',
  'fehler_titel' => 'Abseits<span class="accent">stellung.</span>',
  'fehler_text' => 'Die Seite wurde leider nicht gefunden. Zurück ins Spiel:',
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
  $wert = strip_tags($wert, '<span><mark><strong><em><br><a>');
  $wert = preg_replace('/<span\b(?![^>]*class="accent")[^>]*>/i', '<span class="accent">', $wert);
  $wert = preg_replace('/<span\b[^>]*class="accent"[^>]*>/i', '<span class="accent">', $wert);
  $wert = preg_replace('/<(mark|strong|em|br)\b[^>]*>/i', '<$1>', $wert);
  // Links: nur echte Web-, Mail- oder Telefonziele; alle übrigen Attribute entfernen
  $wert = preg_replace_callback('/<a\b[^>]*>/i', function ($m) {
    if (preg_match('/href\s*=\s*("([^"]*)"|\'([^\']*)\')/i', $m[0], $h)) {
      $ziel = trim($h[2] !== '' ? $h[2] : ($h[3] ?? ''));
      if (preg_match('#^(https?://|mailto:|tel:)#i', $ziel)) {
        return '<a href="' . htmlspecialchars($ziel, ENT_QUOTES) . '">';
      }
    }
    return '';
  }, $wert);
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

// Anmelden – mit dateibasierter Bremse gegen Durchprobieren
// (sessionunabhängig: gilt auch, wenn der Angreifer keine Cookies mitschickt)
define('SPERR_DATEI', __DIR__ . '/loginsperre.json');
function sperre_lesen() {
  if (!is_file(SPERR_DATEI)) return ['fehl' => 0, 'seit' => 0];
  $d = json_decode((string)file_get_contents(SPERR_DATEI), true);
  return is_array($d) ? $d + ['fehl' => 0, 'seit' => 0] : ['fehl' => 0, 'seit' => 0];
}
function sperre_schreiben($d) { @file_put_contents(SPERR_DATEI, json_encode($d), LOCK_EX); }

if (is_file(PASSWORT_DATEI) && !eingeloggt() && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['passwort'])) {
  $sperre = sperre_lesen();
  // Zähler nach 15 Minuten Ruhe zurücksetzen
  if ($sperre['seit'] > 0 && time() - $sperre['seit'] > 900) $sperre = ['fehl' => 0, 'seit' => 0];
  if ($sperre['fehl'] >= 20 && time() - $sperre['seit'] < 900) {
    $fehler = 'Zu viele Fehlversuche. Bitte warten Sie 15 Minuten und versuchen Sie es dann erneut.';
  } else {
    if ($sperre['fehl'] >= 5) sleep(2); // jede weitere Antwort verzögern
    $hash = require PASSWORT_DATEI;
    if (password_verify((string)$_POST['passwort'], (string)$hash)) {
      $_SESSION['redaktion_ok'] = true;
      session_regenerate_id(true);
      sperre_schreiben(['fehl' => 0, 'seit' => 0]);
    } else {
      usleep(random_int(300000, 800000)); // Timing verschleiern
      sperre_schreiben(['fehl' => $sperre['fehl'] + 1, 'seit' => time()]);
      $fehler = 'Das Passwort ist nicht korrekt.';
    }
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
        $wert = text_bereinigen((string)$_POST['feld'][$schluessel]);
        // Unverändert oder geleert => Standardtext gilt, kein Eintrag nötig
        if ($wert === '' || $wert === (VORGABEN[$schluessel] ?? null)) unset($inhalte[$schluessel]);
        else $inhalte[$schluessel] = $wert;
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
  details.box summary { font-size:.8rem; text-transform:uppercase; letter-spacing:.14em; color:var(--blau); font-weight:700; cursor:pointer; user-select:none; }
  details.box[open] summary { margin-bottom:14px; }
  details.box summary::marker { color:var(--blauhell); }
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
  <p class="hinweis">Hier bearbeiten Sie alle Texte der Website: Startseite, Anmelden-Seite, Kontaktseite und Fehlerseite (Impressum, Datenschutz und Konto-Löschen sind Rechtstexte und bleiben fest). Klappen Sie einen Bereich auf, ändern Sie die Texte und klicken Sie unten auf „Alles speichern“ – die Website zeigt die neuen Texte sofort.<br>Tipps: Text zwischen <code>&lt;span class="accent"&gt;</code> und <code>&lt;/span&gt;</code> erscheint <strong style="color:var(--blau)">blau</strong>. Ein geleertes Feld springt beim Speichern auf den eingebauten Standardtext zurück.</p>

  <form method="post">
    <input type="hidden" name="csrf" value="<?= htmlspecialchars(csrf_token()) ?>">
    <?php
      $gruppen = [];
      foreach (FELDER as $schluessel => [$gruppe, $beschriftung, $mehrzeilig]) {
        $gruppen[$gruppe][] = [$schluessel, $beschriftung, $mehrzeilig];
      }
      $erste = true;
      foreach ($gruppen as $gruppe => $felder): ?>
        <details class="box"<?= $erste ? ' open' : '' ?>><?php $erste = false; ?>
          <summary><?= htmlspecialchars($gruppe) ?></summary>
          <?php foreach ($felder as [$schluessel, $beschriftung, $mehrzeilig]):
            $gespeichert = (string)($inhalte[$schluessel] ?? '');
            $wert = $gespeichert !== '' ? $gespeichert : (string)(VORGABEN[$schluessel] ?? ''); ?>
            <label for="f_<?= $schluessel ?>"><?= htmlspecialchars($beschriftung) ?></label>
            <?php if ($mehrzeilig): ?>
              <textarea id="f_<?= $schluessel ?>" name="feld[<?= $schluessel ?>]"><?= htmlspecialchars($wert) ?></textarea>
            <?php else: ?>
              <input type="text" id="f_<?= $schluessel ?>" name="feld[<?= $schluessel ?>]" value="<?= htmlspecialchars($wert) ?>">
            <?php endif; ?>
          <?php endforeach; ?>
        </details>
      <?php endforeach; ?>
    <div class="speicherleiste">
      <button class="knopf" type="submit" name="speichern" value="1">Alles speichern</button>
    </div>
  </form>

<?php endif; ?>

</main>
</body>
</html>
