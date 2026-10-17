#!/usr/bin/env node
/**
 * Setzt die Passwoerter der Demo-Konten aus seed.sql (Befund S-9):
 * Passwoerter liegen NICHT im Repository, sondern kommen aus SEED_DEMO_PASSWORD.
 *
 * Verwendung (lokal nach `supabase db reset`):
 *   SUPABASE_URL=http://127.0.0.1:54321 \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   SEED_DEMO_PASSWORD='ein-langes-demo-passwort' \
 *   node supabase/seed-users.mjs
 *
 * Staging: zusaetzlich --allow-remote (Produktion ist ausgeschlossen: das
 * Skript verweigert URLs, die nicht ausdruecklich als Staging markiert sind).
 * Keine Abhaengigkeiten – nutzt die GoTrue-Admin-API direkt.
 */

const DEMO_USERS = [
  ["d0000000-0000-4000-a000-000000000001", "superadmin@muster-handelsgruppe.test"],
  ["d0000000-0000-4000-a000-000000000002", "trainer@muster-handelsgruppe.test"],
  ["d0000000-0000-4000-a000-000000000003", "orgadmin@muster-handelsgruppe.test"],
  ["d0000000-0000-4000-a000-000000000004", "max.muster@muster-handelsgruppe.test"],
  ["d0000000-0000-4000-a000-000000000005", "anna.beispiel@muster-handelsgruppe.test"],
];

const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const password = process.env.SEED_DEMO_PASSWORD ?? "";
const allowRemote = process.argv.includes("--allow-remote");

function fail(msg) {
  console.error(`Abbruch: ${msg}`);
  process.exit(1);
}

if (!url || !key) fail("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY muessen gesetzt sein.");
if (password.length < 12) fail("SEED_DEMO_PASSWORD muss mindestens 12 Zeichen haben.");

const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url);
if (!isLocal) {
  if (!allowRemote) fail(`${url} ist nicht lokal. Fuer Staging --allow-remote angeben.`);
  if (!/staging/i.test(url) && !/staging/i.test(process.env.SUPABASE_ENV_NAME ?? "")) {
    fail("Remote-Ziel ist nicht als Staging markiert (URL oder SUPABASE_ENV_NAME muss 'staging' enthalten). Produktion ist ausgeschlossen.");
  }
}

const headers = {
  "Content-Type": "application/json",
  apikey: key,
  Authorization: `Bearer ${key}`,
};

let ok = 0;
for (const [id, email] of DEMO_USERS) {
  const res = await fetch(`${url}/auth/v1/admin/users/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ password, email_confirm: true }),
  });
  if (res.ok) {
    ok += 1;
    console.log(`Passwort gesetzt: ${email}`);
  } else {
    console.error(`Fehler bei ${email}: HTTP ${res.status} ${await res.text()}`);
  }
}

console.log(`${ok}/${DEMO_USERS.length} Demo-Konten aktualisiert.`);
process.exit(ok === DEMO_USERS.length ? 0 : 1);
