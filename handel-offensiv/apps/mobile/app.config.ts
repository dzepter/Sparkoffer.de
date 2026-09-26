/**
 * Expo-Konfiguration "Handel Offensiv" (statt app.json, damit Kommentare und
 * per Umgebungsvariable konfigurierbare Werte möglich sind).
 *
 * iOS hat Priorität (Briefing) – Android bleibt minimal lauffähig,
 * das Android-Release-Setup ist bewusst zurückgestellt.
 *
 * Icon & Splash-Motiv: bewusst KEINE Platzhalter-PNGs erzeugt –
 * echte Assets liefert der Auftraggeber, siehe docs/NEEDED_FROM_CLIENT.md
 * ("App Icon 1024×1024 und Splash-Motiv"). Bis dahin nutzt Expo sein
 * Standard-Icon; der Splash zeigt die dunkle Markenfläche (#12160E).
 */
import type { ExpoConfig } from "expo/config";

/**
 * KONFIGURIERBARER PLATZHALTER (docs/NEEDED_FROM_CLIENT.md):
 * Der Bundle Identifier muss vom Auftraggeber im Apple Developer Account
 * bestätigt werden. Überschreibbar ohne Codeänderung via Umgebungsvariable
 * APP_BUNDLE_ID beim Build (z. B. in EAS: env im Build-Profil).
 */
const IOS_BUNDLE_ID = process.env.APP_BUNDLE_ID ?? "de.aigneroffensiv.handeloffensiv";

/** PLATZHALTER analog für Android (Release-Setup zurückgestellt). */
const ANDROID_PACKAGE = process.env.APP_ANDROID_PACKAGE ?? "de.aigneroffensiv.handeloffensiv";

const config: ExpoConfig = {
  name: "Handel Offensiv",
  slug: "handel-offensiv",
  version: "1.0.0",
  // Deep-Link-Schema, z. B. handeloffensiv:///(tabs)/heute
  scheme: "handeloffensiv",
  orientation: "portrait",
  // Expliziter Light Mode (Briefing §35/§56) – kein System-Dark-Mode
  userInterfaceStyle: "light",
  backgroundColor: "#F7F6F1",
  // New Architecture bewusst deaktiviert, bis alle Libraries verifiziert sind
  newArchEnabled: false,
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: IOS_BUNDLE_ID,
    buildNumber: "1",
    supportsTablet: false,
    config: {
      // Nur Standard-TLS (HTTPS) – keine eigene Kryptographie-Exportmeldung nötig
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      // BEWUSST KEINE Kamera-/Mikrofon-/Standort-/Kontakte-Permissions.
      // Fotobibliothek nur lesend und nur für den optionalen Foto-Nachweis
      // bei Transferaufgaben (Briefing §29) – Begründung ist Pflichttext:
      NSPhotoLibraryUsageDescription:
        "Sie können optional ein Foto aus Ihrer Mediathek als Nachweis zu einer Transferaufgabe hochladen. Der Zugriff erfolgt nur, wenn Sie ein Foto auswählen.",
    },
  },
  android: {
    // Minimal lauffähig; Release-Konfiguration (Signing, adaptiveIcon,
    // Play-Store-Setup) bewusst zurückgestellt.
    package: ANDROID_PACKAGE,
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        // Splash: dunkle Markenfläche; Bildmotiv folgt vom Auftraggeber
        // (docs/NEEDED_FROM_CLIENT.md) und wird hier als "image" ergänzt.
        backgroundColor: "#12160E",
      },
    ],
    [
      "expo-notifications",
      {
        // Android-Akzentfarbe für Benachrichtigungen (Markengrün);
        // "icon" (monochrom) folgt mit den Assets des Auftraggebers.
        color: "#A8C62B",
      },
    ],
  ],
  notification: {
    // Push-Verhalten: in-App dezent anzeigen (Handling in src/lib/notifications.ts)
    iosDisplayInForeground: true,
  },
  extra: {
    // EAS-Projekt-ID wird beim Anlegen des EAS-Projekts ergänzt
    // (benötigt für expo-notifications getExpoPushTokenAsync):
    // eas: { projectId: "..." },
  },
};

export default config;
