/**
 * Datenlayer NACHRICHTEN: Ankuendigungen der aktiven Gruppe und eigene
 * In-App-Benachrichtigungen. Alle Zugriffe ueber den Client der
 * NUTZERSITZUNG (RLS: announcements_select, notifications_select_own).
 * Fehler werden als deutsche Meldung (`error`) geliefert, nicht geworfen.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AnnouncementRow, NotificationRow, Uuid } from "@handel-offensiv/types";

import { ERROR_MESSAGES } from "@/lib/errors";

type Db = SupabaseClient;

export type Announcement = Pick<AnnouncementRow, "id" | "title" | "body" | "published_at">;

export interface NachrichtenData {
  announcements: Announcement[];
  notifications: NotificationRow[];
  unreadCount: number;
  error: string | null;
}

const NOTIFICATIONS_LIMIT = 100;

/** Ankuendigungen (neueste zuerst, nur bereits veroeffentlichte) + eigene Benachrichtigungen. */
export async function loadNachrichten(supabase: Db, cohortId: Uuid | null, now: Date = new Date()): Promise<NachrichtenData> {
  const [annRes, notRes] = await Promise.all([
    cohortId !== null
      ? supabase
          .from("announcements")
          .select("id, title, body, published_at")
          .eq("cohort_id", cohortId)
          .lte("published_at", now.toISOString())
          .order("published_at", { ascending: false })
      : Promise.resolve({ data: [] as Announcement[], error: null }),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(NOTIFICATIONS_LIMIT),
  ]);

  if (annRes.error || notRes.error) {
    return { announcements: [], notifications: [], unreadCount: 0, error: ERROR_MESSAGES.load };
  }

  const notifications = (notRes.data as NotificationRow[] | null) ?? [];
  return {
    announcements: (annRes.data as Announcement[] | null) ?? [],
    notifications,
    unreadCount: notifications.filter((n) => n.read_at === null).length,
    error: null,
  };
}

/** Anzahl ungelesener Benachrichtigungen (RLS: nur eigene). Bei Fehlern 0. */
export async function loadUnreadCount(supabase: Db): Promise<number> {
  const { count, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}
