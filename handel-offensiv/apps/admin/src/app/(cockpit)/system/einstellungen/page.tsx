import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge, Card, ErrorState, PageHeader } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { ERROR_MESSAGES } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * SYSTEM / EINSTELLUNGEN: bewusster Platzhalter.
 * Dokumentiert die geplanten Einstellungen, damit klar ist, was hier einmal
 * konfigurierbar wird – und verlinkt den bereits funktionsfaehigen
 * MFA-Bereich (TOTP) fuer das eigene Konto.
 */

const PLANNED_SETTINGS: Array<{ title: string; description: string }> = [
  {
    title: "Programm-Standardwerte",
    description:
      "Standard-Zeitzone, Standard-Freischaltlogik neuer Gruppen und Vorbelegung der Modulstruktur (aktuell fest aus PROGRAM_DEFAULTS im Paket @handel-offensiv/config).",
  },
  {
    title: "E-Mail-Absender und Vorlagen",
    description:
      "Absenderadresse, Antwortadresse und Textbausteine für Einladungs- und Erinnerungs-E-Mails (aktuell in den Edge Functions hinterlegt).",
  },
  {
    title: "Push-Benachrichtigungen",
    description:
      "Ruhezeiten (z. B. kein Versand vor 8 Uhr), Absendername und ein monatliches Mengenlimit je Gruppe – Push soll sparsam bleiben.",
  },
  {
    title: "Datenaufbewahrung (DSGVO)",
    description:
      "Fristen für die Anonymisierung inaktiver Konten und die Aufbewahrung von Abgaben nach Programmende, inklusive Lauf der Löschbegehren.",
  },
  {
    title: "MFA-Pflicht für Cockpit-Rollen",
    description:
      "Option, Zwei-Faktor-Authentifizierung für Super Admins, Org-Admins und Trainer verpflichtend zu machen (Erzwingung über Supabase Auth AAL2).",
  },
];

export default async function EinstellungenPage() {
  const session = await getActorContext();
  if (!session) redirect("/login");
  if (!session.actor.isSuperAdmin) {
    return <ErrorState title="Kein Zugriff" message={ERROR_MESSAGES.forbidden} />;
  }

  return (
    <>
      <PageHeader
        kicker="System"
        title="Einstellungen"
        description="Zentrale Systemeinstellungen. Die meisten Werte sind derzeit bewusst fest im Code bzw. in der Datenbank hinterlegt – dieser Bereich dokumentiert, was künftig hier konfigurierbar wird."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Zwei-Faktor-Authentifizierung (MFA)"
          action={<Badge tone="brand">Verfügbar</Badge>}
        >
          <p className="text-sm text-ink-soft">
            Schützen Sie Ihr Cockpit-Konto mit einem zweiten Faktor (TOTP, z.&nbsp;B.
            Authenticator-App). Die Einrichtung erfolgt über{" "}
            <code className="font-mono text-xs">supabase.auth.mfa</code> direkt für Ihr eigenes
            Konto – es werden keine Geheimnisse auf dem Server gespeichert, die über die
            Supabase-Auth-Datenbank hinausgehen.
          </p>
          <Link
            href="/system/einstellungen/mfa"
            className="mt-4 inline-flex min-h-touch items-center rounded bg-green px-5 text-sm font-bold uppercase tracking-kicker text-dark hover:bg-green-bright"
          >
            MFA einrichten und verwalten
          </Link>
        </Card>

        <Card title="Super-Admin-Kennzeichen" action={<Badge>Nur per Datenbank</Badge>}>
          <p className="text-sm text-ink-soft">
            Das Feld <code className="font-mono text-xs">profiles.is_super_admin</code> wird im
            Cockpit ausschließlich angezeigt (siehe Benutzer &amp; Rollen). Vergabe und Entzug
            erfolgen bewusst nur kontrolliert per SQL/Migration durch die technische
            Administration – nie über die Oberfläche.
          </p>
        </Card>
      </div>

      <section aria-labelledby="geplante-einstellungen" className="mt-10">
        <h2
          id="geplante-einstellungen"
          className="mb-3 text-lg font-extrabold uppercase tracking-tight text-ink"
        >
          Geplante Einstellungen
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {PLANNED_SETTINGS.map((s) => (
            <Card key={s.title} title={s.title} action={<Badge>Geplant</Badge>}>
              <p className="text-sm text-ink-soft">{s.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
