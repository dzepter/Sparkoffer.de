/**
 * Sichere Weiterleitungsziele (kein Open Redirect).
 *
 * Erlaubt sind ausschliesslich RELATIVE Pfade innerhalb des Campus:
 * beginnen mit "/", nicht mit "//" oder "/\" (Protocol-relative URLs),
 * keine Steuerzeichen. Alles andere faellt auf den Default zurueck.
 */

const SAFE_PATH = /^\/(?![/\\])[^\r\n\t]*$/;

export function safeRelativePath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 512) return fallback;
  return SAFE_PATH.test(trimmed) ? trimmed : fallback;
}
