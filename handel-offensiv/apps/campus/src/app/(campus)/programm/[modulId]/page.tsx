import { permanentRedirect } from "next/navigation";

/**
 * Modul-Detail: alle Module stehen auf einer Seite (/programm) – die
 * Modul-URL springt per Anker zum jeweiligen Abschnitt.
 */
export default async function ModulPage({ params }: { params: Promise<{ modulId: string }> }) {
  const { modulId } = await params;
  const safe = /^[0-9a-f-]{36}$/i.test(modulId) ? modulId : "";
  permanentRedirect(safe ? `/programm#modul-${safe}` : "/programm");
}
