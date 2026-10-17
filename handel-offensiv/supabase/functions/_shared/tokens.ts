/**
 * Token-Helfer fuer Einladungen.
 *
 * SICHERHEIT: Das Klartext-Token verlaesst den Server nur als Bestandteil der
 * Einladungs-URL (E-Mail bzw. Antwort an den berechtigten Admin). In der
 * Datenbank liegt AUSSCHLIESSLICH der SHA-256-Hash (invitations.token_hash).
 */

/** 32 Zufallsbytes als base64url (43 Zeichen, ohne Padding). */
export function generateInvitationToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** SHA-256 als Hex-String (Speicherform in invitations.token_hash). */
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
