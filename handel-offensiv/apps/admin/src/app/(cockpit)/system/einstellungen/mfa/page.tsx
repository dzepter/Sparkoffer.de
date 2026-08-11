import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui";
import { getActorContext } from "@/lib/auth";
import { MfaManager } from "./mfa-manager";

export const dynamic = "force-dynamic";

/**
 * SYSTEM / EINSTELLUNGEN / MFA: TOTP-Enrollment fuer das EIGENE Konto.
 * Die eigentliche Interaktion (enroll / verify / unenroll) laeuft im Client
 * ueber supabase.auth.mfa mit dem anon key – es fliesst kein Service-Role-Key
 * und kein Geheimnis ueber unsere Server.
 */
export default async function MfaPage() {
  const session = await getActorContext();
  if (!session) redirect("/login");

  return (
    <>
      <PageHeader
        kicker="System / Einstellungen"
        title="Zwei-Faktor-Authentifizierung"
        description="Richten Sie einen zweiten Faktor (TOTP) für Ihr eigenes Cockpit-Konto ein. Sie benötigen eine Authenticator-App, z. B. Aegis, FreeOTP oder den Passwortmanager Ihres Vertrauens."
        actions={
          <Link
            href="/system/einstellungen"
            className="inline-flex min-h-touch items-center rounded px-3 text-sm font-bold uppercase tracking-kicker text-ink-soft hover:bg-paper hover:text-ink"
          >
            Zurück zu Einstellungen
          </Link>
        }
      />
      <MfaManager />
    </>
  );
}
