/**
 * Name des Sitzungs-Cookies der Akademie.
 *
 * Akademie (/akademie, /login) und Cockpit (/admin) laufen unter EINEM Host
 * (www.handel-offensiv.de). Ohne eigenen Namen wuerden beide Apps dasselbe
 * Supabase-Cookie (sb-<ref>-auth-token) lesen und ueberschreiben: Eine
 * Anmeldung im Cockpit waere zugleich eine Anmeldung in der Akademie und
 * umgekehrt, und ein Logout traefe beide. Mit getrennten Namen bleiben die
 * Sitzungen unabhaengig. Pfad "/" ist noetig, weil der Login-Einstieg unter
 * /login (Rewrite der Website-Shell) liegt, die Akademie selbst unter /akademie.
 *
 * Muss in Middleware, Server-Client und Browser-Client identisch sein
 * (kein server-only-Import: die Middleware laeuft am Edge).
 */
export const AUTH_COOKIE_OPTIONS = { name: "ho-akademie-auth", path: "/" } as const;
