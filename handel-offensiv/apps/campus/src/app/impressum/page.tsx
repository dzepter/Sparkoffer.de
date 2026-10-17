import type { Metadata } from "next";
import Link from "next/link";

import { APP } from "@handel-offensiv/config";
import { Badge, Card } from "@handel-offensiv/ui";

import { AuthHeading, PublicFrame } from "@/app/(auth)/public-frame";

export const metadata: Metadata = { title: "Impressum" };

/**
 * Impressum – ENTWURF. Belegte Angaben stammen aus docs/CURRENT_STATE.md
 * (Bestands-Impressum der Website); alles Weitere ist Platzhalter und wird
 * nach juristischer Pruefung durch den Auftraggeber ersetzt. Keine
 * erfundenen Rechtsfakten.
 */
export default function ImpressumPage() {
  return (
    <PublicFrame width="wide">
      <AuthHeading kicker="Rechtliches" title="Impressum">
        Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz) für den {APP.name} Campus.
      </AuthHeading>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <Badge tone="warning">Entwurf</Badge>
        <span>[ENTWURF – juristische Prüfung ausstehend]</span>
      </div>

      <div className="space-y-4">
        <Card title="Anbieter">
          <address className="not-italic text-sm leading-6 text-ink">
            <strong>{APP.company}</strong>
            <br />
            Viola &amp; Rainer Aigner
            <br />
            [Platzhalter: Straße und Hausnummer]
            <br />
            [Platzhalter: PLZ] München
          </address>
          <p className="mt-3 text-xs text-ink-soft">
            [ENTWURF] Rechtsform: [zu klären – der Handelsregistereintrag im Bestands-Impressum nennt keine Rechtsform].
          </p>
        </Card>

        <Card title="Kontakt">
          <dl className="grid gap-2 text-sm text-ink sm:grid-cols-[auto_1fr] sm:gap-x-6">
            <dt className="font-bold">E-Mail</dt>
            <dd>
              <a href={`mailto:${APP.supportEmail}`} className="font-bold text-navy underline underline-offset-2">
                {APP.supportEmail}
              </a>
            </dd>
            <dt className="font-bold">Telefon</dt>
            <dd>[Platzhalter: Telefonnummer]</dd>
          </dl>
        </Card>

        <Card title="Registereintrag">
          <dl className="grid gap-2 text-sm text-ink sm:grid-cols-[auto_1fr] sm:gap-x-6">
            <dt className="font-bold">Handelsregister</dt>
            <dd>HRB 152556</dd>
            <dt className="font-bold">Registergericht</dt>
            <dd>[Platzhalter: Registergericht – zu prüfen]</dd>
            <dt className="font-bold">Umsatzsteuer-ID</dt>
            <dd>[Platzhalter: USt-IdNr. gemäß § 27a UStG – zu prüfen]</dd>
          </dl>
        </Card>

        <Card title="Verantwortlich für den Inhalt">
          <p className="text-sm text-ink">[Platzhalter: Name und Anschrift der inhaltlich verantwortlichen Person (§ 18 Abs. 2 MStV)]</p>
        </Card>

        <Card title="Hinweise">
          <div className="space-y-3 text-sm text-ink-soft">
            <p>
              [ENTWURF] Der {APP.name} Campus ist ein geschlossener Lernbereich für eingeladene Teilnehmerinnen und
              Teilnehmer des Präsenzprogramms {APP.name}. Es findet keine öffentliche Registrierung statt.
            </p>
            <p>
              [Platzhalter: Hinweis zur Streitbeilegung (Verbraucherstreitbeilegung / OS-Plattform), Haftung für Inhalte
              und Links, Urheberrecht – nach juristischer Prüfung ergänzen.]
            </p>
          </div>
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
