/**
 * Expo-Push-Versand (gemeinsam genutzt von send-push und release-scheduler).
 *
 * - Laedt aktive push_tokens (disabled_at IS NULL) der Zielprofile.
 * - Versendet in Batches à 100 an https://exp.host/--/api/v2/push/send.
 * - Wertet Fehler-Tickets aus: DeviceNotRegistered -> push_tokens.disabled_at
 *   setzen (§19), damit tote Geraete nicht erneut adressiert werden.
 *
 * Optional: EXPO_ACCESS_TOKEN (Enhanced Push Security) als Bearer-Header.
 */

import type { AdminClient } from "./supabaseAdmin.ts";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100;

export interface PushPayload {
  title: string;
  body: string;
  /** In-App-Deep-Link, landet in data.deepLink. */
  deepLink?: string;
}

export interface PushResult {
  /** Anzahl adressierter Geraete (aktive Tokens). */
  tokens: number;
  /** Erfolgreich angenommene Tickets. */
  ok: number;
  /** Fehler-Tickets gesamt. */
  errors: number;
  /** Davon wegen DeviceNotRegistered deaktivierte Tokens. */
  disabled: number;
}

interface ExpoTicket {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

/**
 * Versendet einen Push an alle aktiven Geraete der uebergebenen Profile.
 * Fehler einzelner Batches brechen den Gesamtversand nicht ab.
 */
export async function sendPushToProfiles(
  admin: AdminClient,
  profileIds: string[],
  payload: PushPayload,
): Promise<PushResult> {
  const result: PushResult = { tokens: 0, ok: 0, errors: 0, disabled: 0 };
  if (profileIds.length === 0) return result;

  const { data: tokenRows, error } = await admin
    .from("push_tokens")
    .select("id, token, profile_id")
    .in("profile_id", profileIds)
    .is("disabled_at", null);

  if (error) {
    console.error("push_tokens konnten nicht geladen werden:", error);
    return result;
  }

  const rows = tokenRows ?? [];
  result.tokens = rows.length;
  if (rows.length === 0) return result;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const expoToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  if (expoToken) headers["Authorization"] = `Bearer ${expoToken}`;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const messages = batch.map((row) => ({
      to: row.token as string,
      title: payload.title,
      body: payload.body,
      sound: "default" as const,
      data: payload.deepLink ? { deepLink: payload.deepLink } : {},
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        console.error("Expo-Push-Batch fehlgeschlagen, Status", res.status, await res.text());
        result.errors += batch.length;
        continue;
      }

      const parsed = (await res.json()) as { data?: ExpoTicket[] };
      const tickets = parsed.data ?? [];

      // Tickets sind positionsgleich zu den gesendeten Messages.
      const deadTokenIds: string[] = [];
      tickets.forEach((ticket, idx) => {
        if (ticket.status === "ok") {
          result.ok += 1;
          return;
        }
        result.errors += 1;
        if (ticket.details?.error === "DeviceNotRegistered") {
          const row = batch[idx];
          if (row) deadTokenIds.push(row.id as string);
        } else {
          console.error("Expo-Push-Ticket-Fehler:", ticket.details?.error, ticket.message);
        }
      });

      if (deadTokenIds.length > 0) {
        const { error: disableError } = await admin
          .from("push_tokens")
          .update({ disabled_at: new Date().toISOString() })
          .in("id", deadTokenIds);
        if (disableError) {
          console.error("push_tokens konnten nicht deaktiviert werden:", disableError);
        } else {
          result.disabled += deadTokenIds.length;
        }
      }
    } catch (err) {
      console.error("Expo-Push-Batch fehlgeschlagen:", err);
      result.errors += batch.length;
    }
  }

  return result;
}
