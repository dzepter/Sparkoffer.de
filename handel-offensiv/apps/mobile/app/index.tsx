/**
 * Weiche beim Start (§38): angemeldet -> HEUTE, sonst Login.
 * Willkommen/Push-Erklärung hängt der Auth-Flow nach Einladung an.
 */
import { Redirect } from "expo-router";
import { useSession } from "../src/lib/auth-context";

export default function Index() {
  const { status } = useSession();

  // Splash bleibt sichtbar, solange die Session lädt (siehe _layout.tsx)
  if (status === "loading") return null;

  if (status === "signedIn") {
    return <Redirect href="/(tabs)/heute" />;
  }
  return <Redirect href="/(auth)/login" />;
}
