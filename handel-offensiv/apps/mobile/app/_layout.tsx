/**
 * Root-Layout: Fonts + Provider + Navigations-Stack.
 *
 * DSGVO-Hinweis Fonts: Archivo wird über @expo-google-fonts/archivo zur
 * Build-Zeit GEBÜNDELT – es findet KEIN Laufzeit-Download von Google-Servern
 * statt, es fließen keine Nutzerdaten an Google (§30).
 */
import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from "@expo-google-fonts/archivo";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { colors } from "@handel-offensiv/config";
import { queryClient, persistOptions } from "../src/lib/query";
import { AuthProvider, useSession } from "../src/lib/auth-context";
import { useNotificationDeepLinks } from "../src/lib/notifications";

// Splash sichtbar halten, bis Fonts + Session-Zustand bereit sind (§38)
void SplashScreen.preventAutoHideAsync();

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { status } = useSession();
  useNotificationDeepLinks();

  useEffect(() => {
    if (fontsReady && status !== "loading") {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady, status]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.paper },
        // Ruhige, präzise Übergänge (§35)
        animation: "fade",
      }}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_700Bold,
    Archivo_800ExtraBold,
  });
  // Bei Font-Fehler trotzdem starten (System-Fallback) statt hängen zu bleiben
  const fontsReady = fontsLoaded || fontError != null;

  if (!fontsReady) return null;

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <AuthProvider>
        {/* Light Mode: dunkle Status-Icons auf hellem Grund */}
        <StatusBar style="dark" backgroundColor={colors.paper} />
        <RootNavigator fontsReady={fontsReady} />
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
