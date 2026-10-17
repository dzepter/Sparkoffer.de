/**
 * Datei-Nachweise im Bucket `participant-uploads` (Migration 0004).
 * Pfad: organizations/{orgId}/cohorts/{cohortId}/profiles/{profileId}/{uuid}-{datei}
 * Die Storage-RLS (app.upload_path_is_own) erlaubt Teilnehmern nur den
 * eigenen Pfad – der Server prueft dieselbe Struktur zusaetzlich vor dem
 * Eintrag in submission_files.
 *
 * Isomorph (Browser + Server), keine Importe aus "server-only".
 */

export const PARTICIPANT_UPLOADS_BUCKET = "participant-uploads";

/** Limits des Buckets (0006: 25 MB, PDF/Bild/Audio) */
export const UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
export const UPLOAD_ALLOWED_MIME: readonly string[] = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/mp4",
];
export const PHOTO_ALLOWED_MIME: readonly string[] = ["image/jpeg", "image/png", "image/webp"];

export const UPLOAD_ERROR_TYPE =
  "Dieses Dateiformat wird nicht unterstützt. Erlaubt sind PDF, JPG, PNG, WebP sowie MP3/M4A.";
export const PHOTO_ERROR_TYPE = "Bitte wählen Sie ein Foto im Format JPG, PNG oder WebP.";
export const UPLOAD_ERROR_SIZE = "Die Datei ist zu groß. Maximal 25 MB sind möglich.";

export function uploadPrefix(orgId: string, cohortId: string, profileId: string): string {
  return `organizations/${orgId}/cohorts/${cohortId}/profiles/${profileId}`;
}

/** Dateiname ohne Sonderzeichen, gekuerzt (Storage-Objektname). */
export function safeFileName(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9._-]/g, "_").replace(/_{2,}/g, "_").replace(/^\.+/, "");
  const trimmed = cleaned.length > 0 ? cleaned : "datei";
  return trimmed.slice(-120);
}

export function buildUploadPath(prefix: string, originalName: string): string {
  return `${prefix}/${crypto.randomUUID()}-${safeFileName(originalName)}`;
}

/** Liegt der Pfad im eigenen Ordner? (Server-Gegenpruefung zur Storage-RLS) */
export function isOwnUploadPath(path: string, prefix: string): boolean {
  if (!path.startsWith(`${prefix}/`)) return false;
  const rest = path.slice(prefix.length + 1);
  return rest.length > 0 && !rest.includes("/") && !rest.includes("..");
}
