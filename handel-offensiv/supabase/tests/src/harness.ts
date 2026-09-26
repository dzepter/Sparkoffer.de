/**
 * Testharness fuer RLS-Tests.
 *
 * Verbindung: DATABASE_URL (Default: lokales PostgreSQL 16, Datenbank
 * handel_offensiv_test, Benutzer postgres/postgres). Der verbundene Benutzer
 * MUSS Superuser sein (Migrationen, Rollenwechsel per SET ROLE).
 *
 * Jeder Test laeuft in einer Transaktion (withTx) und wird zurueckgerollt –
 * Fixtures bleiben unveraendert, Tests sind unabhaengig voneinander.
 *
 * Rollen-Simulation wie PostgREST: `set local role authenticated` plus
 * request.jwt.claims = {"sub": "<profile-id>", "role": "authenticated"}.
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

export const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/handel_offensiv_test";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SUPABASE_DIR = path.resolve(HERE, "../..");
export const MIGRATIONS_DIR = path.join(SUPABASE_DIR, "migrations");
export const SHIM_DIR = path.join(SUPABASE_DIR, "tests", "shim");
export const FIXTURES_DIR = path.join(SUPABASE_DIR, "tests", "fixtures");

export async function connect(): Promise<Client> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  return client;
}

function sqlFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => path.join(dir, f));
}

/** Setzt alle Schemata zurueck und spielt Shim, Migrationen und Fixtures ein. */
export async function resetDatabase(client: Client): Promise<string[]> {
  await client.query(`
    drop schema if exists public cascade;
    drop schema if exists app cascade;
    drop schema if exists auth cascade;
    drop schema if exists storage cascade;
    drop schema if exists extensions cascade;
    drop schema if exists graphql_public cascade;
    create schema public;
    grant usage, create on schema public to public;
  `);

  const applied: string[] = [];
  for (const file of [...sqlFiles(SHIM_DIR), ...sqlFiles(MIGRATIONS_DIR), ...sqlFiles(FIXTURES_DIR)]) {
    const sql = readFileSync(file, "utf8");
    try {
      await client.query(sql);
    } catch (err) {
      throw new Error(`SQL-Datei fehlgeschlagen: ${path.relative(SUPABASE_DIR, file)}\n${String(err)}`);
    }
    applied.push(path.relative(SUPABASE_DIR, file));
  }
  return applied;
}

export type Row = Record<string, unknown>;

/** Transaktions-Kontext mit Rollen-/Claim-Umschaltung. */
export class Tx {
  constructor(private readonly client: Client) {}

  /** Als angemeldeter Nutzer (Rolle authenticated) mit auth.uid() = profileId. */
  async actAs(profileId: string): Promise<void> {
    await this.client.query("reset role");
    await this.client.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: profileId, role: "authenticated", aud: "authenticated" }),
    ]);
    await this.client.query("set local role authenticated");
  }

  /** Rolle authenticated, aber JWT ohne sub (defekter/fremder Token). */
  async actAsAuthenticatedWithoutSub(): Promise<void> {
    await this.client.query("reset role");
    await this.client.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ role: "authenticated", aud: "authenticated" }),
    ]);
    await this.client.query("set local role authenticated");
  }

  /** Als anonymer Aufrufer (Rolle anon, keine Claims). */
  async actAsAnon(): Promise<void> {
    await this.client.query("reset role");
    await this.client.query("select set_config('request.jwt.claims', '', true)");
    await this.client.query("set local role anon");
  }

  /** Als Superuser/Service (RLS-Bypass) – fuer Testvorbereitung innerhalb der Transaktion. */
  async actAsService(): Promise<void> {
    await this.client.query("reset role");
    await this.client.query("select set_config('request.jwt.claims', '', true)");
  }

  async rows<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
    const res = await this.client.query(sql, params);
    return res.rows as T[];
  }

  async count(sql: string, params: unknown[] = []): Promise<number> {
    const rows = await this.rows(sql, params);
    return rows.length;
  }

  /** Fuehrt ein Statement aus und liefert den Fehlertext (oder null bei Erfolg). */
  async attempt(sql: string, params: unknown[] = []): Promise<string | null> {
    // Savepoint, damit ein erwarteter Fehler die Transaktion nicht abbricht
    await this.client.query("savepoint attempt_sp");
    try {
      await this.client.query(sql, params);
      await this.client.query("release savepoint attempt_sp");
      return null;
    } catch (err) {
      await this.client.query("rollback to savepoint attempt_sp");
      return err instanceof Error ? err.message : String(err);
    }
  }

  /** Anzahl betroffener Zeilen eines UPDATE/DELETE (RLS filtert stillschweigend). */
  async affected(sql: string, params: unknown[] = []): Promise<number> {
    await this.client.query("savepoint affected_sp");
    try {
      const res = await this.client.query(sql, params);
      await this.client.query("release savepoint affected_sp");
      return res.rowCount ?? 0;
    } catch (err) {
      await this.client.query("rollback to savepoint affected_sp");
      throw err;
    }
  }
}

/** Fuehrt fn in einer Transaktion aus und rollt IMMER zurueck. */
export async function withTx<T>(client: Client, fn: (tx: Tx) => Promise<T>): Promise<T> {
  await client.query("begin");
  try {
    return await fn(new Tx(client));
  } finally {
    await client.query("rollback");
    await client.query("reset role");
  }
}
