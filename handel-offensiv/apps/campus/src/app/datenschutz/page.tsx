import type { Metadata } from "next";
import Link from "next/link";

import { APP, PRIVACY_POLICY_VERSION } from "@handel-offensiv/config";
import { Badge, Card } from "@handel-offensiv/ui";

import { AuthHeading, PublicFrame } from "@/app/(auth)/public-frame";

export const metadata: Metadata = { title: "Datenschutz" };

/**
 * Datenschutzerklaerung – ENTWURF (Version PRIVACY_POLICY_VERSION).
 * Enthaelt nur den technischen Rahmen des Campus (siehe docs/PRIVACY_TECHNICAL.md);
 * rechtliche Formulierungen, Rechtsgrundlagen und Fristen sind Platzhalter
 * und werden nach juristischer Pruefung ersetzt. Keine erfundenen Rechtsfakten.
 */
export default function DatenschutzPage() {
  return (
    <PublicFrame width="wide">
      <AuthHeading kicker="Rechtliches" title="Datenschutzerklärung">
        Wie {APP.company} Ihre Daten im {APP.name} Campus verarbeitet. Version {PRIVACY_POLICY_VERSION}.
      </AuthHeading>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <Badge tone="warning">Entwurf</Badge>
        <span>[ENTWURF – juristische Prüfung ausstehend]</span>
      </div>

      <div className="space-y-4">
        <Card title="1. Verantwortlicher">
          <address className="not-italic text-sm leading-6 text-ink">
            <strong>{APP.company}</strong>
            <br />
            Viola &amp; Rainer Aigner
            <br />
            [Platzhalter: Straße und Hausnummer]
            <br />
            [Platzhalter: PLZ] München
            <br />
            E-Mail:{" "}
            <a href={`mailto:${APP.supportEmail}`} className="font-bold text-navy underline underline-offset-2">
              {APP.supportEmail}
            </a>
          </address>
          <p className="mt-3 text-xs text-ink-soft">[Platzhalter: Datenschutzbeauftragte/r, falls benannt]</p>
        </Card>

        <Card title="2. Was der Campus ist">
          <p className="text-sm leading-6 text-ink">
            [ENTWURF] Der {APP.name} Campus ist der geschlossene Lernbereich zum Präsenzprogramm {APP.name}. Zugang
            erhalten ausschließlich Personen, die von ihrem Unternehmen oder von {APP.company} eingeladen wurden. Eine
            öffentliche Registrierung gibt es nicht.
          </p>
        </Card>

        <Card title="3. Welche Daten verarbeitet werden">
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-ink">
            <li>
              <strong>Zugangsdaten:</strong> E-Mail-Adresse, Passwort (nur als Hash gespeichert), Vor- und Nachname,
              Zeitpunkt der Anmeldung.
            </li>
            <li>
              <strong>Zuordnung:</strong> Unternehmen und Gruppe, in die Sie eingeladen wurden; Rolle (Teilnehmer,
              Trainer).
            </li>
            <li>
              <strong>Lerndaten:</strong> Lernfortschritt, Antworten auf Aufgaben und Quizfragen, Einträge im
              Offensivplan, hochgeladene Dateien, Reflexionen.
            </li>
            <li>
              <strong>Einstellungen:</strong> Benachrichtigungswünsche, aktive Gruppe, erteilte Einwilligungen (mit
              Version und Zeitpunkt).
            </li>
            <li>
              <strong>Technische Daten:</strong> [Platzhalter: Server-Logs, IP-Adresse, Zeitpunkt – Speicherdauer zu
              prüfen].
            </li>
          </ul>
        </Card>

        <Card title="4. Wer Ihre Lerndaten sehen kann">
          <div className="space-y-3 text-sm leading-6 text-ink">
            <p>
              [ENTWURF] Ihre <strong>privaten Reflexionen</strong> sind nur für Sie sichtbar. Sie entscheiden je
              Eintrag, ob Sie ihn zusätzlich für Ihre Trainerin oder Ihren Trainer freigeben.
            </p>
            <p>
              Ansprechpersonen Ihres Unternehmens (Organisations-Administration) sehen{" "}
              <strong>keine Reflexionen und keine privaten Abgaben</strong>, sondern ausschließlich Zuordnung und
              Bearbeitungsstand. Diese Trennung ist technisch in der Datenbank verankert.
            </p>
          </div>
        </Card>

        <Card title="5. Zweck und Rechtsgrundlage">
          <div className="space-y-3 text-sm leading-6 text-ink">
            <p>
              [ENTWURF] Die Verarbeitung dient der Durchführung des Programms {APP.name}, an dem Sie teilnehmen
              (Bereitstellung der Lerninhalte, Begleitung durch Trainer, Nachweis des Lernfortschritts).
            </p>
            <p className="text-ink-soft">
              [Platzhalter: Rechtsgrundlagen nach Art. 6 Abs. 1 DSGVO je Verarbeitungszweck – z. B. Vertrag,
              berechtigtes Interesse, Einwilligung – nach juristischer Prüfung ergänzen.]
            </p>
          </div>
        </Card>

        <Card title="6. Hosting und Auftragsverarbeiter">
          <div className="space-y-3 text-sm leading-6 text-ink">
            <p>
              [ENTWURF] Die Daten des Campus werden auf Servern in der Europäischen Union verarbeitet (Datenbank und
              Dateispeicher: Region Frankfurt am Main; Auslieferung der Anwendung: Region Frankfurt am Main).
            </p>
            <p className="text-ink-soft">
              [Platzhalter: Liste der Auftragsverarbeiter (Datenbank-/Hosting-Anbieter, E-Mail-Versand) inklusive
              Auftragsverarbeitungsverträgen – nach Abschluss der Verträge ergänzen.]
            </p>
          </div>
        </Card>

        <Card title="7. Cookies und Speicherung im Browser">
          <p className="text-sm leading-6 text-ink">
            [ENTWURF] Der Campus setzt ausschließlich technisch notwendige Cookies: für Ihre Anmeldung (Sitzung) und
            für die Auswahl Ihrer aktiven Gruppe. Es werden keine Tracking- oder Werbe-Cookies eingesetzt und keine
            Analysedienste Dritter eingebunden.
          </p>
        </Card>

        <Card title="8. E-Mail-Benachrichtigungen">
          <p className="text-sm leading-6 text-ink">
            [ENTWURF] E-Mails zu neuen Inhalten, Terminen, Aufgaben und Feedback erhalten Sie nur, wenn Sie dies in
            Ihrem Profil aktivieren. Sie können die Einstellung jederzeit unter „Profil“ ändern. Unabhängig davon
            versenden wir Sicherheits-E-Mails (z. B. zum Zurücksetzen Ihres Passworts).
          </p>
        </Card>

        <Card title="9. Speicherdauer und Löschung">
          <div className="space-y-3 text-sm leading-6 text-ink">
            <p>
              [ENTWURF] Sie können jederzeit in Ihrem Profil die Löschung Ihres Kontos beantragen. {APP.company}{" "}
              bestätigt den Antrag und führt die Löschung anschließend durch.
            </p>
            <p className="text-ink-soft">
              [Platzhalter: Speicherfristen für Lerndaten nach Programmende, Aufbewahrungspflichten, Umgang mit
              Daten bei Austritt aus dem Unternehmen – nach juristischer Prüfung ergänzen.]
            </p>
          </div>
        </Card>

        <Card title="10. Ihre Rechte">
          <div className="space-y-3 text-sm leading-6 text-ink">
            <p>
              [ENTWURF] Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
              Datenübertragbarkeit und Widerspruch sowie das Recht, eine erteilte Einwilligung jederzeit zu
              widerrufen. Wenden Sie sich dazu an{" "}
              <a href={`mailto:${APP.supportEmail}`} className="font-bold text-navy underline underline-offset-2">
                {APP.supportEmail}
              </a>
              .
            </p>
            <p className="text-ink-soft">
              [Platzhalter: zuständige Aufsichtsbehörde und Beschwerderecht – nach juristischer Prüfung ergänzen.]
            </p>
          </div>
        </Card>

        <Card title="11. Änderungen dieser Erklärung">
          <p className="text-sm leading-6 text-ink">
            [ENTWURF] Bei inhaltlichen Änderungen erhält diese Erklärung eine neue Version. Sie werden im Campus
            darauf hingewiesen und um erneute Zustimmung gebeten. Aktuelle Version: {PRIVACY_POLICY_VERSION}.
          </p>
        </Card>
      </div>

      <p className="mt-8 text-center text-sm">
        <Link href="/login" className="inline-flex min-h-touch items-center font-bold text-navy underline-offset-2 hover:underline">
          Zurück zur Anmeldung
        </Link>
      </p>
    </PublicFrame>
  );
}
