/**
 * Anzahl ungelesener Benachrichtigungen (RLS: nur eigene Zeilen).
 * Für die HEUTE-Karte "NEUE NACHRICHT" gedacht – der HEUTE-Screen kann
 * diesen Hook importieren und bei count > 0 auf /nachrichten verlinken.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/auth-context";

export const NOTIFICATIONS_QUERY_KEY = "nachrichten";
export const UNREAD_COUNT_QUERY_KEY = "nachrichten-ungelesen";

export function useUnreadNotificationCount(): number {
  const { session } = useSession();
  const profileId = session?.user.id ?? null;

  const query = useQuery({
    queryKey: [UNREAD_COUNT_QUERY_KEY, profileId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: profileId !== null,
    staleTime: 30_000,
  });

  return query.data ?? 0;
}
