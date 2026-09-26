"use client";

import { Banner } from "@handel-offensiv/ui";
import type { BlockConfigMap } from "@handel-offensiv/validation";

import type { SubmissionView } from "@/features/lernen/data";
import { formatDateTime } from "@/features/lernen/format";

import { BlockFrame } from "./block-frame";
import { UploadField } from "./upload-field";

export interface FileUploadBlockProps {
  blockId: string;
  lessonId: string;
  cohortId: string;
  uploadPrefix: string;
  required: boolean;
  done: boolean;
  kind: "file_upload" | "photo_upload";
  config: BlockConfigMap["file_upload"] | BlockConfigMap["photo_upload"];
  submission: SubmissionView | null;
}

/**
 * Datei-Nachweis (file_upload) bzw. freiwilliges Foto (photo_upload, §12):
 * Upload in participant-uploads, Eintrag in submission_files an der
 * Abgabe-Zeile des Blocks. Der Freiwilligkeitshinweis steht gut sichtbar.
 */
export function FileUploadBlock({ blockId, lessonId, cohortId, uploadPrefix, required, done, kind, config, submission }: FileUploadBlockProps) {
  const photo = kind === "photo_upload";
  const maxFiles = "maxFiles" in config ? config.maxFiles : 1;
  const voluntaryNote = "voluntaryNote" in config ? config.voluntaryNote : null;

  return (
    <BlockFrame id={blockId} label={photo ? "Foto" : "Datei-Nachweis"} required={required && !photo} done={done}>
      <h3 className="text-base font-bold text-ink">{config.title}</h3>
      {config.description ? <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">{config.description}</p> : null}
      {voluntaryNote ? (
        <Banner kind="info" className="mt-3 border-l-[3px] border-l-navy" message={<span className="font-bold text-ink">{voluntaryNote}</span>} />
      ) : null}
      <div className="mt-4">
        <UploadField
          blockId={blockId}
          lessonId={lessonId}
          cohortId={cohortId}
          uploadPrefix={uploadPrefix}
          photosOnly={photo}
          maxFiles={maxFiles}
          files={submission?.files ?? []}
        />
      </div>
      {submission && submission.feedback.length > 0 ? (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-xs font-bold uppercase tracking-kicker text-ink-soft">Feedback Ihres Trainers</p>
          <ul className="mt-2 space-y-2">
            {submission.feedback.map((f) => (
              <li key={f.id} className="rounded border-l-[3px] border-navy bg-paper px-3 py-2">
                <p className="whitespace-pre-line text-sm text-ink">{f.body}</p>
                <p className="mt-1 text-xs text-ink-soft">{formatDateTime(f.created_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </BlockFrame>
  );
}
