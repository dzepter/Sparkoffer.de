/**
 * Signierte URLs für private Storage-Inhalte (Bucket "learning-assets").
 * Zugriff steuert die DB (RLS auf storage.objects) – der Client fragt nur
 * mit dem anon key + Session an. Signierte URLs sind 1 h gültig; der
 * Query-Cache hält sie 45 min frisch, damit nie eine abgelaufene URL
 * aus dem Cache verwendet wird.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export const LEARNING_ASSETS_BUCKET = "learning-assets";
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const SIGNED_URL_STALE_MS = 45 * 60 * 1000;

/** Erzeugt eine signierte URL (wirft mit verständlicher deutscher Meldung). */
export async function createSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(LEARNING_ASSETS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (error !== null || data === null) {
    throw new Error(
      "Die Datei konnte gerade nicht geladen werden. Bitte versuchen Sie es erneut.",
    );
  }
  return data.signedUrl;
}

/** Hook: signierte URL für einen Storage-Pfad (undefined = kein Pfad). */
export function useSignedUrl(storagePath: string | undefined) {
  return useQuery({
    queryKey: ["signed-url", storagePath],
    enabled: storagePath !== undefined,
    staleTime: SIGNED_URL_STALE_MS,
    // Signierte URLs nach App-Neustart nie aus dem persistierten Cache
    // verwenden (könnten abgelaufen sein): kurze gcTime unter maxAge hilft,
    // zusätzlich refetcht mount bei stale.
    gcTime: SIGNED_URL_STALE_MS,
    queryFn: () => createSignedUrl(storagePath as string),
  });
}
