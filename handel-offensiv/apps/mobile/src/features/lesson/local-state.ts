/**
 * Lokale, UNKRITISCHE Block-Zustände in AsyncStorage (§34):
 * - Checklisten-Haken, Inline-Fragen-Antworten, Skalenwerte
 * - Entwürfe (Reflexion/Transfernachweis) vor dem Submit
 *
 * NIE Tokens oder sensible Daten – dafür gibt es expo-secure-store
 * (siehe src/lib/supabase.ts). Schlüssel sind je Profil UND Block
 * namespaced, damit Gerätewechsel des Accounts keine fremden Daten zeigt.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

function blockKey(profileId: string, blockId: string): string {
  return `ho.block.${profileId}.${blockId}`;
}

function draftKey(profileId: string, blockId: string): string {
  return `ho.draft.${profileId}.${blockId}`;
}

export async function loadBlockState<T>(
  profileId: string,
  blockId: string,
): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(blockKey(profileId, blockId));
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export async function saveBlockState<T>(
  profileId: string,
  blockId: string,
  value: T,
): Promise<void> {
  try {
    await AsyncStorage.setItem(blockKey(profileId, blockId), JSON.stringify(value));
  } catch {
    // Lokaler Cache – Fehlschlag ist unkritisch
  }
}

export async function loadDraft(profileId: string, blockId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(draftKey(profileId, blockId));
  } catch {
    return null;
  }
}

export async function saveDraft(
  profileId: string,
  blockId: string,
  text: string,
): Promise<void> {
  try {
    await AsyncStorage.setItem(draftKey(profileId, blockId), text);
  } catch {
    // s. o.
  }
}

export async function clearDraft(profileId: string, blockId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(draftKey(profileId, blockId));
  } catch {
    // s. o.
  }
}

/**
 * Hook: lokaler Block-Zustand mit Persistenz.
 * Liefert [value, setValue, hydrated] – hydrated wird true, sobald der
 * gespeicherte Wert geladen wurde (bis dahin Initialwert).
 */
export function usePersistedBlockState<T>(
  profileId: string,
  blockId: string,
  initial: T,
): [T, (next: T) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    void loadBlockState<T>(profileId, blockId).then((stored) => {
      if (!mounted) return;
      if (stored !== null) setValue(stored);
      setHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, [profileId, blockId]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      void saveBlockState(profileId, blockId, next);
    },
    [profileId, blockId],
  );

  return [value, update, hydrated];
}
