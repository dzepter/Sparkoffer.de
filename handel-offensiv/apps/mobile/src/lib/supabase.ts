/**
 * Supabase-Client für die Mobile-App.
 *
 * SICHERHEIT:
 * - Ausschließlich der anon key wird verwendet – Rechte erzwingt die DB via RLS.
 * - Session-Tokens liegen NIE in AsyncStorage. Wir nutzen das von Supabase
 *   dokumentierte "LargeSecureStore"-Muster: expo-secure-store hat ein
 *   ~2048-Byte-Limit pro Eintrag, Supabase-Sessions (JWT + Refresh-Token)
 *   überschreiten das. Daher liegt im SecureStore nur ein zufälliger
 *   AES-256-Schlüssel (klein, hardware-gesichert), die eigentliche Session
 *   wird damit AES-CTR-verschlüsselt und der Ciphertext in AsyncStorage
 *   abgelegt. Ohne den Schlüssel aus dem SecureStore ist der Ciphertext
 *   wertlos – robust und ohne fehleranfälliges Chunking.
 */
import * as aesjs from "aes-js";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { createClient, type SupportedStorage } from "@supabase/supabase-js";

/** SecureStore erlaubt nur [A-Za-z0-9._-] als Key. */
function secureKeyFor(key: string): string {
  return `ho_k_${key.replace(/[^A-Za-z0-9._-]/g, "_")}`;
}

class LargeSecureStore implements SupportedStorage {
  private async encrypt(key: string, value: string): Promise<string> {
    // 256-Bit-Schlüssel je Eintrag, sicher erzeugt (expo-crypto CSPRNG)
    const encryptionKey = Crypto.getRandomValues(new Uint8Array(256 / 8));
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

    await SecureStore.setItemAsync(
      secureKeyFor(key),
      aesjs.utils.hex.fromBytes(encryptionKey),
      // Kein iCloud-Backup des Schlüssels; Zugriff erst nach erstem Entsperren
      { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK },
    );
    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async decrypt(key: string, value: string): Promise<string | null> {
    const encryptionKeyHex = await SecureStore.getItemAsync(secureKeyFor(key));
    if (!encryptionKeyHex) return null;

    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1),
    );
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (encrypted === null) return null;
    try {
      return await this.decrypt(key, encrypted);
    } catch {
      // Inkonsistenter Zustand (z. B. App-Neuinstallation ohne Keychain-Reset):
      // defensiv aufräumen, Nutzer meldet sich neu an.
      await this.removeItem(key);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const encrypted = await this.encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(secureKeyFor(key));
  }
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Konfigurationsfehler beim Entwickeln sofort sichtbar machen –
  // .env.example liegt zentral im Repo-Root.
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY fehlen. Bitte .env anhand von .env.example anlegen.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    // Kein Browser-Redirect-Flow in der nativen App
    detectSessionInUrl: false,
  },
});

// Token-Refresh nur, solange die App im Vordergrund ist (Supabase-Empfehlung)
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});
