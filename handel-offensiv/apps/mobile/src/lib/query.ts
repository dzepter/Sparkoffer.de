/**
 * React-Query-Setup mit Offline-Persistenz (Briefing §34).
 *
 * - Der Query-Cache (bereits gelesene Inhalte) wird in AsyncStorage
 *   persistiert – NUR unkritischer Cache, niemals Tokens (siehe supabase.ts).
 * - maxAge 24 h: Danach gilt der persistierte Cache als veraltet und wird
 *   verworfen; frisch geladene Daten ersetzen ihn ohnehin laufend.
 * - Verbindungserkennung: onlineManager wird an expo-network gekoppelt,
 *   damit Queries bei Rückkehr der Verbindung automatisch erneut laufen.
 *   Zusätzlich bleiben fetch-Fehler + retry das Sicherheitsnetz, falls das
 *   Betriebssystem den Netzstatus verzögert meldet.
 */
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client";
import * as Network from "expo-network";

/** 24 Stunden – maximales Alter des persistierten Caches */
export const QUERY_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Inhalte ändern sich selten – 1 min frisch, Cache lebt 24 h (für Persistenz)
      staleTime: 60 * 1000,
      gcTime: QUERY_CACHE_MAX_AGE_MS,
      retry: 2,
      refetchOnReconnect: true,
    },
    mutations: {
      // Mutationen nicht blind wiederholen (Doppel-Submits vermeiden);
      // Entwürfe puffern die Feature-Screens vor dem Submit in AsyncStorage.
      retry: 0,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "handel-offensiv.query-cache",
  throttleTime: 2000,
});

/** Optionen für <PersistQueryClientProvider> in app/_layout.tsx */
export const persistOptions: Omit<PersistQueryClientOptions, "queryClient"> = {
  persister: asyncStoragePersister,
  maxAge: QUERY_CACHE_MAX_AGE_MS,
  // Bei inkompatiblen Cache-Strukturen Version hochzählen -> Cache verwerfen
  buster: "v1",
  dehydrateOptions: {
    // Nur erfolgreiche Ergebnisse persistieren (kein Persistieren von Fehlern)
    shouldDehydrateQuery: (query) => query.state.status === "success",
  },
};

// Online-Status an expo-network koppeln
onlineManager.setEventListener((setOnline) => {
  const subscription = Network.addNetworkStateListener((state) => {
    setOnline(state.isConnected === true && state.isInternetReachable !== false);
  });
  return () => subscription.remove();
});

// "Fokus" in React Native = App kommt in den Vordergrund
AppState.addEventListener("change", (status) => {
  focusManager.setFocused(status === "active");
});
