/**
 * Push-Benachrichtigungen (Briefing §37).
 *
 * WICHTIG: registerForPush() wird NUR nach dem Erklär-Screen aufgerufen
 * ("BENACHRICHTIGUNGEN AKTIVIEREN" / "SPÄTER") – niemals ungefragt beim
 * App-Start. Erst Nutzen erklären, dann System-Permission-Dialog.
 */
import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import type { PushPlatform, PushTokenInsert } from "@handel-offensiv/types";
import { supabase } from "./supabase";

// In-App eingehende Benachrichtigungen dezent anzeigen (kein Badge-Spam)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const DEVICE_ID_KEY = "ho_device_id";

/**
 * Stabile Geräte-ID: Expo bietet keine installationId mehr, daher erzeugen
 * wir einmalig eine UUID und halten sie im SecureStore (überlebt App-Updates).
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;
  const deviceId = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
  return deviceId;
}

export type RegisterPushResult =
  | { ok: true; token: string }
  | { ok: false; reason: "denied" | "simulator" | "not-signed-in" | "error" };

/**
 * Fragt die System-Permission ab (nur nach Erklär-Screen aufrufen!),
 * holt das Expo-Push-Token und speichert es in push_tokens (Upsert je
 * profile_id + device_id, RLS erlaubt nur eigene Zeilen).
 */
export async function registerForPush(): Promise<RegisterPushResult> {
  try {
    if (!Device.isDevice) {
      // Simulator/Emulator liefert keine Push-Tokens
      return { ok: false, reason: "simulator" };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const profileId = sessionData.session?.user.id;
    if (!profileId) return { ok: false, reason: "not-signed-in" };

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const request = await Notifications.requestPermissionsAsync();
      status = request.status;
    }
    if (status !== "granted") return { ok: false, reason: "denied" };

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Mitteilungen",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200],
      });
    }

    // EAS-Projekt-ID (app.config.ts extra.eas.projectId – folgt mit EAS-Setup)
    const projectId: string | undefined =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
        ?.projectId ?? Constants.easConfig?.projectId ?? undefined;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse.data;

    const platform: PushPlatform = Platform.OS === "ios" ? "ios" : "android";
    const deviceId = await getOrCreateDeviceId();

    const insert: PushTokenInsert = {
      profile_id: profileId,
      device_id: deviceId,
      token,
      platform,
    };
    const { error } = await supabase
      .from("push_tokens")
      .upsert(
        { ...insert, last_seen_at: new Date().toISOString(), disabled_at: null },
        { onConflict: "profile_id,device_id" },
      );
    if (error) return { ok: false, reason: "error" };

    return { ok: true, token };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/** Push-Token dieses Geräts deaktivieren (z. B. in den Profileinstellungen). */
export async function disablePushForDevice(): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const profileId = sessionData.session?.user.id;
  if (!profileId) return;
  const deviceId = await getOrCreateDeviceId();
  await supabase
    .from("push_tokens")
    .update({ disabled_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .eq("device_id", deviceId);
}

/** deep_link aus einer Notification-Response extrahieren (nur interne Routen). */
function deepLinkFrom(
  response: Notifications.NotificationResponse | null,
): string | null {
  const data = response?.notification.request.content.data as
    | Record<string, unknown>
    | undefined;
  const deepLink = data?.deep_link;
  // Nur interne Pfade zulassen ("/..."), keine fremden URLs öffnen
  if (typeof deepLink === "string" && deepLink.startsWith("/")) return deepLink;
  return null;
}

/**
 * Hook fürs Root-Layout: Tippt der Nutzer eine Benachrichtigung an,
 * navigieren wir zum enthaltenen deep_link (notifications.deep_link,
 * z. B. "/(tabs)/programm"). Behandelt auch den Kaltstart über die
 * zuletzt angetippte Benachrichtigung.
 */
export function useNotificationDeepLinks(): void {
  const router = useRouter();

  useEffect(() => {
    let handledColdStart = false;

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (handledColdStart) return;
      handledColdStart = true;
      const link = deepLinkFrom(response);
      // Kurz verzögern, bis der Router-Stack steht
      if (link) setTimeout(() => router.push(link as never), 300);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const link = deepLinkFrom(response);
        if (link) router.push(link as never);
      },
    );

    return () => subscription.remove();
  }, [router]);
}
