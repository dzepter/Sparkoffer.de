/**
 * Persistentes Rate Limit (Migration 0008, Sicherheitsbefunde S-6 / S-16):
 * - Token-Bucket-Semantik von public.rate_limit_take (Kapazitaet, Nachfuellen
 *   ueber die Zeit, Deckelung auf die Kapazitaet, Schluessel unabhaengig)
 * - rate_limit_reset und app.rate_limit_cleanup
 * - Nur service_role darf die Funktionen ausfuehren; authenticated/anon
 *   erhalten "permission denied" (auch fuer die Tabelle rate_limits).
 *
 * Zeit: now() ist innerhalb einer Transaktion konstant; "vergangene Zeit"
 * wird durch direktes Zuruecksetzen von refilled_at (als Service) simuliert.
 */
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connect, withTx, type Tx } from "./harness";
import { A } from "./ids";

let client: Client;
beforeAll(async () => {
  client = await connect();
});
afterAll(async () => {
  await client.end();
});

const PERMISSION_DENIED = /permission denied/i;

/** Wie PostgREST fuer den Service-Role-Key: Rolle service_role (RLS-Bypass). */
async function actAsServiceRole(tx: Tx): Promise<void> {
  await tx.actAsService();
  await tx.rows("set local role service_role");
}

async function take(tx: Tx, key: string, capacity: number, refillPerMinute: number): Promise<boolean> {
  const [row] = await tx.rows<{ ok: boolean }>("select public.rate_limit_take($1, $2, $3) as ok", [
    key,
    capacity,
    refillPerMinute,
  ]);
  return row!.ok;
}

/** Simuliert vergangene Zeit: refilled_at um `minutes` Minuten zurueckdrehen (Superuser). */
async function ageBucket(tx: Tx, key: string, minutes: number): Promise<void> {
  await tx.actAsService();
  const affected = await tx.affected(
    "update public.rate_limits set refilled_at = now() - make_interval(mins => $2) where key = $1",
    [key, minutes],
  );
  expect(affected).toBe(1);
  await tx.rows("set local role service_role");
}

async function tokensOf(tx: Tx, key: string): Promise<number | null> {
  await tx.actAsService();
  const [row] = await tx.rows<{ tokens: string }>("select tokens from public.rate_limits where key = $1", [key]);
  await tx.rows("set local role service_role");
  return row ? Number(row.tokens) : null;
}

describe("rate_limit_take – Bucket-Semantik", () => {
  it("liefert genau `capacity` Tokens, danach false", async () => {
    await withTx(client, async (tx) => {
      await actAsServiceRole(tx);
      const key = "test:capacity:abc";
      expect(await take(tx, key, 3, 1)).toBe(true);
      expect(await take(tx, key, 3, 1)).toBe(true);
      expect(await take(tx, key, 3, 1)).toBe(true);
      expect(await take(tx, key, 3, 1)).toBe(false);
      expect(await take(tx, key, 3, 1)).toBe(false);
      expect(await tokensOf(tx, key)).toBe(0);
    });
  });

  it("fuellt anteilig zur vergangenen Zeit nach (2 Tokens/min, 1 min -> 2 Tokens)", async () => {
    await withTx(client, async (tx) => {
      await actAsServiceRole(tx);
      const key = "test:refill:abc";
      for (let i = 0; i < 3; i += 1) expect(await take(tx, key, 3, 2)).toBe(true);
      expect(await take(tx, key, 3, 2)).toBe(false);

      await ageBucket(tx, key, 1);
      expect(await take(tx, key, 3, 2)).toBe(true);
      expect(await take(tx, key, 3, 2)).toBe(true);
      expect(await take(tx, key, 3, 2)).toBe(false);
    });
  });

  it("nachgefuellte Tokens werden auf die Kapazitaet gedeckelt", async () => {
    await withTx(client, async (tx) => {
      await actAsServiceRole(tx);
      const key = "test:cap:abc";
      expect(await take(tx, key, 2, 10)).toBe(true);
      await ageBucket(tx, key, 60 * 24); // ein Tag – weit mehr als 2 Tokens
      expect(await take(tx, key, 2, 10)).toBe(true);
      expect(await take(tx, key, 2, 10)).toBe(true);
      expect(await take(tx, key, 2, 10)).toBe(false);
      expect(await tokensOf(tx, key)).toBe(0);
    });
  });

  it("Bruchteile werden akkumuliert (0,5 Tokens/min: nach 1 min false, nach 2 min true)", async () => {
    await withTx(client, async (tx) => {
      await actAsServiceRole(tx);
      const key = "test:fraction:abc";
      expect(await take(tx, key, 1, 0.5)).toBe(true);
      expect(await take(tx, key, 1, 0.5)).toBe(false);

      await ageBucket(tx, key, 1);
      expect(await take(tx, key, 1, 0.5)).toBe(false); // 0,5 Tokens – reicht nicht
      expect(await tokensOf(tx, key)).toBeCloseTo(0.5, 6);

      await ageBucket(tx, key, 1);
      expect(await take(tx, key, 1, 0.5)).toBe(true); // 0,5 + 0,5 = 1
      expect(await take(tx, key, 1, 0.5)).toBe(false);
    });
  });

  it("Schluessel sind unabhaengig voneinander", async () => {
    await withTx(client, async (tx) => {
      await actAsServiceRole(tx);
      expect(await take(tx, "test:a", 1, 1)).toBe(true);
      expect(await take(tx, "test:a", 1, 1)).toBe(false);
      expect(await take(tx, "test:b", 1, 1)).toBe(true);
      expect(await take(tx, "test:b", 1, 1)).toBe(false);
    });
  });

  it("weist unbrauchbare Parameter ab (leerer Schluessel, Kapazitaet < 1, negative Rate)", async () => {
    await withTx(client, async (tx) => {
      await actAsServiceRole(tx);
      expect(await tx.attempt("select public.rate_limit_take('', 5, 1)")).toMatch(/Rate-Limit-Schlüssel/);
      expect(await tx.attempt("select public.rate_limit_take(null, 5, 1)")).toMatch(/Rate-Limit-Schlüssel/);
      expect(await tx.attempt("select public.rate_limit_take('k', 0, 1)")).toMatch(/Rate-Limit-Parameter/);
      expect(await tx.attempt("select public.rate_limit_take('k', 5, -1)")).toMatch(/Rate-Limit-Parameter/);
      expect(await tx.attempt(`select public.rate_limit_take(repeat('x', 201), 5, 1)`)).toMatch(/Rate-Limit-Schlüssel/);
      // Rate 0 ist erlaubt (fester Vorrat ohne Nachfuellen)
      expect(await take(tx, "test:norefill", 1, 0)).toBe(true);
      expect(await take(tx, "test:norefill", 1, 0)).toBe(false);
    });
  });
});

describe("rate_limit_reset und app.rate_limit_cleanup", () => {
  it("reset loescht den Bucket, danach ist die volle Kapazitaet wieder verfuegbar", async () => {
    await withTx(client, async (tx) => {
      await actAsServiceRole(tx);
      const key = "test:reset:abc";
      expect(await take(tx, key, 1, 0)).toBe(true);
      expect(await take(tx, key, 1, 0)).toBe(false);
      await tx.rows("select public.rate_limit_reset($1)", [key]);
      expect(await tokensOf(tx, key)).toBeNull();
      expect(await take(tx, key, 1, 0)).toBe(true);
      // Reset eines unbekannten Schluessels ist ein No-op
      expect(await tx.attempt("select public.rate_limit_reset('test:unbekannt')")).toBeNull();
    });
  });

  it("cleanup loescht nur Buckets, die seit mehr als einem Tag unberuehrt sind", async () => {
    await withTx(client, async (tx) => {
      await actAsServiceRole(tx);
      expect(await take(tx, "test:alt", 1, 1)).toBe(true);
      expect(await take(tx, "test:frisch", 1, 1)).toBe(true);
      await ageBucket(tx, "test:alt", 60 * 25);
      await ageBucket(tx, "test:frisch", 60 * 23);

      const [row] = await tx.rows<{ n: number }>("select app.rate_limit_cleanup() as n");
      expect(row!.n).toBe(1);
      expect(await tokensOf(tx, "test:alt")).toBeNull();
      expect(await tokensOf(tx, "test:frisch")).not.toBeNull();
    });
  });
});

describe("Nur service_role darf das Rate Limit benutzen", () => {
  it("authenticated (Teilnehmer, Trainer, Org-Admin) erhaelt permission denied", async () => {
    await withTx(client, async (tx) => {
      for (const who of [A.p1, A.trainer, A.admin]) {
        await tx.actAs(who);
        expect(await tx.attempt("select public.rate_limit_take('test:x', 5, 1)")).toMatch(PERMISSION_DENIED);
        expect(await tx.attempt("select public.rate_limit_reset('test:x')")).toMatch(PERMISSION_DENIED);
        expect(await tx.attempt("select app.rate_limit_take('test:x', 5, 1)")).toMatch(PERMISSION_DENIED);
        expect(await tx.attempt("select app.rate_limit_cleanup()")).toMatch(PERMISSION_DENIED);
        expect(await tx.attempt("select * from public.rate_limits")).toMatch(PERMISSION_DENIED);
        expect(await tx.attempt("insert into public.rate_limits (key, tokens) values ('test:x', 1)")).toMatch(
          PERMISSION_DENIED,
        );
      }
    });
  });

  it("anon und authenticated ohne sub erhalten permission denied", async () => {
    await withTx(client, async (tx) => {
      await tx.actAsAnon();
      expect(await tx.attempt("select public.rate_limit_take('test:x', 5, 1)")).toMatch(PERMISSION_DENIED);
      expect(await tx.attempt("select public.rate_limit_reset('test:x')")).toMatch(PERMISSION_DENIED);
      expect(await tx.attempt("select * from public.rate_limits")).toMatch(PERMISSION_DENIED);

      await tx.actAsAuthenticatedWithoutSub();
      expect(await tx.attempt("select public.rate_limit_take('test:x', 5, 1)")).toMatch(PERMISSION_DENIED);
    });
  });

  it("service_role darf ausfuehren; Buckets sind fuer authenticated auch danach unsichtbar", async () => {
    await withTx(client, async (tx) => {
      await actAsServiceRole(tx);
      expect(await take(tx, "test:service", 1, 1)).toBe(true);
      await tx.actAs(A.p1);
      expect(await tx.attempt("select key from public.rate_limits where key = 'test:service'")).toMatch(
        PERMISSION_DENIED,
      );
    });
  });
});
