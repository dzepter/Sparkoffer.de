/**
 * BlockRenderer (Server Component): rendert einen content_block anhand seines
 * block_type – alle 18 Typen. Die config wird IMMER mit Zod
 * (@handel-offensiv/validation) geparst; ungueltige Konfigurationen zeigen
 * einen verstaendlichen Hinweis statt technischer Details.
 *
 * Rezeptive Bloecke bleiben Server Components (signierte URLs entstehen
 * serverseitig); interaktive Bloecke sind Client Components mit Server Actions.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ContentBlockRow } from "@handel-offensiv/types";
import { safeParseBlockConfig } from "@handel-offensiv/validation";

import type { LessonBundle } from "@/features/lernen/data";

import { InvalidBlock } from "./block-frame";
import { ChecklistBlock } from "./checklist-block";
import { ChoiceBlock } from "./choice-block";
import { FileUploadBlock } from "./file-upload-block";
import { AnnouncementBlock, AudioBlock, ExternalLinkBlock, FileLinkBlock, ImageBlock, TextBlock, VideoBlock } from "./media-blocks";
import { PracticeTaskBlock } from "./practice-task-block";
import { QuizBlock } from "./quiz-block";
import { ReflectionBlock } from "./reflection-block";
import { ScaleBlock } from "./scale-block";
import { TransferTaskBlock } from "./transfer-task-block";

export interface BlockRendererProps {
  block: ContentBlockRow;
  bundle: LessonBundle;
  supabase: SupabaseClient;
  cohortId: string;
  /** organizations/{org}/cohorts/{cohort}/profiles/{profile} */
  uploadPrefix: string;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export async function BlockRenderer({ block, bundle, supabase, cohortId, uploadPrefix }: BlockRendererProps) {
  const lessonId = bundle.lesson.id;
  const id = block.id;
  const required = block.required;
  const done = bundle.done[id] === true;
  const response = bundle.responses[id] ?? {};
  const common = { blockId: id, lessonId, cohortId, required, done };

  switch (block.block_type) {
    case "text": {
      const p = safeParseBlockConfig("text", block.config);
      return p.success ? <TextBlock id={id} required={required} config={p.data} /> : <InvalidBlock id={id} />;
    }
    case "video": {
      const p = safeParseBlockConfig("video", block.config);
      return p.success ? <VideoBlock id={id} required={required} supabase={supabase} config={p.data} /> : <InvalidBlock id={id} />;
    }
    case "audio": {
      const p = safeParseBlockConfig("audio", block.config);
      return p.success ? <AudioBlock id={id} required={required} supabase={supabase} config={p.data} /> : <InvalidBlock id={id} />;
    }
    case "pdf": {
      const p = safeParseBlockConfig("pdf", block.config);
      return p.success ? <FileLinkBlock id={id} required={required} supabase={supabase} kind="pdf" config={p.data} /> : <InvalidBlock id={id} />;
    }
    case "download": {
      const p = safeParseBlockConfig("download", block.config);
      return p.success ? <FileLinkBlock id={id} required={required} supabase={supabase} kind="download" config={p.data} /> : <InvalidBlock id={id} />;
    }
    case "image": {
      const p = safeParseBlockConfig("image", block.config);
      return p.success ? <ImageBlock id={id} required={required} supabase={supabase} config={p.data} /> : <InvalidBlock id={id} />;
    }
    case "external_link": {
      const p = safeParseBlockConfig("external_link", block.config);
      return p.success ? <ExternalLinkBlock id={id} required={required} config={p.data} /> : <InvalidBlock id={id} />;
    }
    case "announcement": {
      const p = safeParseBlockConfig("announcement", block.config);
      return p.success ? <AnnouncementBlock id={id} config={p.data} /> : <InvalidBlock id={id} />;
    }
    case "checklist": {
      const p = safeParseBlockConfig("checklist", block.config);
      return p.success ? <ChecklistBlock {...common} config={p.data} checked={stringArray(response.checked)} /> : <InvalidBlock id={id} />;
    }
    case "scale": {
      const p = safeParseBlockConfig("scale", block.config);
      return p.success ? (
        <ScaleBlock {...common} config={p.data} value={typeof response.value === "number" ? response.value : null} />
      ) : (
        <InvalidBlock id={id} />
      );
    }
    case "single_choice":
    case "multiple_choice": {
      const p = safeParseBlockConfig(block.block_type, block.config);
      return p.success ? (
        <ChoiceBlock {...common} kind={block.block_type} config={p.data} selected={stringArray(response.selected)} />
      ) : (
        <InvalidBlock id={id} />
      );
    }
    case "practice_task": {
      const p = safeParseBlockConfig("practice_task", block.config);
      return p.success ? <PracticeTaskBlock {...common} config={p.data} /> : <InvalidBlock id={id} />;
    }
    case "reflection": {
      const p = safeParseBlockConfig("reflection", block.config);
      const entry = bundle.reflections[id];
      return p.success ? (
        <ReflectionBlock
          {...common}
          config={p.data}
          entry={entry ? { body: entry.body, visibility: entry.visibility, updated_at: entry.updated_at } : null}
        />
      ) : (
        <InvalidBlock id={id} />
      );
    }
    case "quiz": {
      const p = safeParseBlockConfig("quiz", block.config);
      const quiz = p.success ? bundle.quizzes[p.data.quizId] : undefined;
      if (!p.success || quiz === undefined) return <InvalidBlock id={id} />;
      return <QuizBlock {...common} bundle={quiz} />;
    }
    case "transfer_task": {
      const p = safeParseBlockConfig("transfer_task", block.config);
      if (!p.success) return <InvalidBlock id={id} />;
      const dueAt =
        p.data.dueMode === "fixed" && p.data.dueAt !== undefined ? p.data.dueAt : (bundle.curriculum.accessByLessonId[lessonId]?.dueAt ?? null);
      return (
        <TransferTaskBlock {...common} uploadPrefix={uploadPrefix} config={p.data} submission={bundle.submissions[id] ?? null} dueAt={dueAt} />
      );
    }
    case "file_upload":
    case "photo_upload": {
      const p = safeParseBlockConfig(block.block_type, block.config);
      return p.success ? (
        <FileUploadBlock {...common} uploadPrefix={uploadPrefix} kind={block.block_type} config={p.data} submission={bundle.submissions[id] ?? null} />
      ) : (
        <InvalidBlock id={id} />
      );
    }
  }
}
