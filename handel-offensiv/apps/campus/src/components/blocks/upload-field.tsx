"use client";

import { useActionState, useId, useRef, useState, useTransition } from "react";

import { Button } from "@handel-offensiv/ui";

import { deleteUploadAction, registerUploadAction, type BlockActionState } from "@/features/lernen/actions";
import type { SubmissionFileView } from "@/features/lernen/data";
import { formatFileSize } from "@/features/lernen/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  buildUploadPath,
  PARTICIPANT_UPLOADS_BUCKET,
  PHOTO_ALLOWED_MIME,
  PHOTO_ERROR_TYPE,
  UPLOAD_ALLOWED_MIME,
  UPLOAD_ERROR_SIZE,
  UPLOAD_ERROR_TYPE,
  UPLOAD_MAX_BYTES,
} from "@/features/lernen/upload-path";

import { FormError } from "./block-frame";

const INITIAL: BlockActionState = { ok: false, error: null };
const UPLOAD_FAILED = "Der Upload ist gerade nicht möglich. Bitte versuchen Sie es erneut.";

export interface UploadFieldProps {
  blockId: string;
  lessonId: string;
  cohortId: string;
  /** Zielordner organizations/{org}/cohorts/{cohort}/profiles/{profile} */
  uploadPrefix: string;
  /** Nur Fotos (photo_upload) */
  photosOnly?: boolean;
  maxFiles: number;
  files: SubmissionFileView[];
  /** Beschriftung des Auswahl-Buttons */
  label?: string;
}

/**
 * Datei-Nachweis: Der Browser laedt direkt in den privaten Bucket
 * participant-uploads (Nutzersitzung, Storage-RLS), danach traegt eine
 * Server Action die Datei in submission_files ein. Vorhandene Dateien
 * erscheinen mit kurzlebigen signierten Links.
 */
export function UploadField({ blockId, lessonId, cohortId, uploadPrefix, photosOnly = false, maxFiles, files, label }: UploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deleteState, deleteAction, deletePending] = useActionState(deleteUploadAction, INITIAL);

  const allowed = photosOnly ? PHOTO_ALLOWED_MIME : UPLOAD_ALLOWED_MIME;
  const accept = photosOnly ? "image/jpeg,image/png,image/webp" : "application/pdf,image/jpeg,image/png,image/webp,audio/mpeg,audio/mp4";
  const full = files.length >= maxFiles;

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!allowed.includes(file.type)) {
      setError(photosOnly ? PHOTO_ERROR_TYPE : UPLOAD_ERROR_TYPE);
      event.target.value = "";
      return;
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      setError(UPLOAD_ERROR_SIZE);
      event.target.value = "";
      return;
    }
    if (file.size === 0) {
      setError("Die Datei ist leer.");
      event.target.value = "";
      return;
    }

    startTransition(async () => {
      const path = buildUploadPath(uploadPrefix, file.name);
      try {
        const supabase = createSupabaseBrowserClient();
        const upload = await supabase.storage.from(PARTICIPANT_UPLOADS_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
        if (upload.error) {
          setError(UPLOAD_FAILED);
          return;
        }
      } catch {
        setError(UPLOAD_FAILED);
        return;
      }
      const result = await registerUploadAction({
        blockId,
        lessonId,
        cohortId,
        storagePath: path,
        mimeType: file.type,
        sizeBytes: file.size,
        originalName: file.name,
      });
      if (!result.ok) setError(result.error ?? UPLOAD_FAILED);
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  return (
    <div className="space-y-3">
      {files.length > 0 ? (
        <ul className="divide-y divide-line rounded border border-line">
          {files.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                {f.url ? (
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-bold text-navy underline underline-offset-2">
                    {f.original_name ?? "Datei"}
                  </a>
                ) : (
                  <span className="font-bold text-ink">{f.original_name ?? "Datei"}</span>
                )}
                <span className="ml-2 text-xs text-ink-soft">{formatFileSize(f.size_bytes)}</span>
              </div>
              <form action={deleteAction}>
                <input type="hidden" name="fileId" value={f.id} />
                <input type="hidden" name="lessonId" value={lessonId} />
                <input type="hidden" name="cohortId" value={cohortId} />
                <Button type="submit" variant="ghost" size="sm" disabled={deletePending} aria-label={`${f.original_name ?? "Datei"} entfernen`}>
                  Entfernen
                </Button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}

      <FormError message={error ?? deleteState.error} />

      {!full ? (
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor={inputId}
            className="inline-flex min-h-touch cursor-pointer items-center justify-center rounded border border-ink bg-white px-5 text-sm font-bold uppercase tracking-kicker text-ink hover:bg-paper"
          >
            {pending ? "Wird hochgeladen …" : (label ?? (photosOnly ? "Foto auswählen" : "Datei auswählen"))}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={onChange}
            disabled={pending}
            aria-describedby={`${inputId}-hinweis`}
          />
          <p id={`${inputId}-hinweis`} className="text-xs text-ink-soft">
            {photosOnly ? "JPG, PNG oder WebP" : "PDF, JPG, PNG, WebP, MP3 oder M4A"} · maximal 25 MB
            {maxFiles > 1 ? ` · bis zu ${maxFiles} Dateien` : ""}
          </p>
        </div>
      ) : (
        <p className="text-xs text-ink-soft">{maxFiles === 1 ? "Eine Datei ist hinterlegt." : `Maximal ${maxFiles} Dateien sind hinterlegt.`}</p>
      )}
    </div>
  );
}
