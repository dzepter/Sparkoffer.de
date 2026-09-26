/**
 * Vitest globalSetup: Datenbank einmal pro Lauf zuruecksetzen und
 * Shim + Migrationen + Fixtures einspielen.
 */
import { connect, resetDatabase } from "./harness";

export async function setup(): Promise<void> {
  const client = await connect();
  try {
    const applied = await resetDatabase(client);
    // eslint-disable-next-line no-console
    console.log(`RLS-Tests: ${applied.length} SQL-Dateien eingespielt (${applied.join(", ")})`);
  } finally {
    await client.end();
  }
}
