/**
 * Signierte URLs fuer private Storage-Inhalte – NUR serverseitig, ueber die
 * Nutzersitzung (RLS auf storage.objects entscheidet). Kurze Gueltigkeit
 * (15 Minuten); die Lernseiten sind dynamisch und erzeugen die URLs je Aufruf.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export const LEARNING_ASSETS_BUCKET = "learning-assets";
/** Maximal 15 Minuten (Vorgabe) */
export const SIGNED_URL_TTL_SECONDS = 15 * 60;

export interface SignedUrlOptions {
  /** Dateiname fuer Content-Disposition: attachment (Download-Link) */
  download?: string;
}

/**
 * Erzeugt eine signierte URL; null, wenn die Datei nicht erreichbar ist
 * (fehlende Berechtigung, fehlender Pfad) – der Block zeigt dann einen Hinweis.
 */
export async function createSignedUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  options: SignedUrlOptions = {},
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS, options.download !== undefined ? { download: options.download } : undefined);
  if (error !== null || data === null) return null;
  return data.signedUrl;
}

/** signUrl-Adapter fuer den VideoProvider aus @handel-offensiv/domain */
export function signUrlAdapter(supabase: SupabaseClient) {
  return async (bucket: string, path: string, ttlSeconds: number): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, Math.min(ttlSeconds, SIGNED_URL_TTL_SECONDS));
    if (error !== null || data === null) {
      throw new Error("Das Video konnte gerade nicht geladen werden. Bitte versuchen Sie es erneut.");
    }
    return data.signedUrl;
  };
}
