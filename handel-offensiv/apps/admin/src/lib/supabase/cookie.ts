/**
 * Name und Pfad des Sitzungs-Cookies des Cockpits.
 *
 * Cockpit (/admin) und Akademie (/akademie, /login) laufen unter EINEM Host
 * (www.handel-offensiv.de). Ohne eigenen Namen wuerden beide Apps dasselbe
 * Supabase-Cookie (sb-<ref>-auth-token) lesen und ueberschreiben. Mit
 * eigenem Namen und Pfad /admin sendet der Browser das Cockpit-Cookie nur
 * an Cockpit-Routen – die Akademie sieht die Admin-Sitzung nie.
 *
 * Muss in Middleware, Server-Client und Browser-Client identisch sein
 * (kein server-only-Import: die Middleware laeuft am Edge).
 */
export const AUTH_COOKIE_OPTIONS = { name: "ho-admin-auth", path: "/admin" } as const;
