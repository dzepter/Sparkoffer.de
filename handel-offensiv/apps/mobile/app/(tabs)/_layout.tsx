/**
 * Die fünf Bereiche (§11): HEUTE, PROGRAMM, OFFENSIVPLAN, TERMINE, PROFIL.
 * Icons: Feather – schlicht, konsistent, keine verspielten Grafiken (§35).
 * Aktiv: dunkles Grün (greenDeep, ausreichender Kontrast auf Weiß) plus
 * Label – nie nur Farbe als Unterscheidung (§36).
 */
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors, touch } from "@handel-offensiv/config";
import { archivoFamily } from "../../src/ui/Text";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.greenDeep,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: archivoFamily("700"),
          fontSize: 10,
          letterSpacing: 0.6,
        },
        tabBarItemStyle: {
          minHeight: touch.minTarget,
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="heute"
        options={{
          title: "HEUTE",
          tabBarAccessibilityLabel: "Heute, Ihr Tagesüberblick",
          tabBarIcon: ({ color, size }) => (
            <Feather name="sun" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="programm"
        options={{
          title: "PROGRAMM",
          tabBarAccessibilityLabel: "Programm, die fünf Module",
          tabBarIcon: ({ color, size }) => (
            <Feather name="layers" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="offensivplan"
        options={{
          title: "OFFENSIVPLAN",
          tabBarAccessibilityLabel: "Offensivplan, Ihr persönlicher Umsetzungsplan",
          tabBarIcon: ({ color, size }) => (
            <Feather name="target" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="termine"
        options={{
          title: "TERMINE",
          tabBarAccessibilityLabel: "Termine, Ihre Präsenztage",
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "PROFIL",
          tabBarAccessibilityLabel: "Profil und Einstellungen",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
