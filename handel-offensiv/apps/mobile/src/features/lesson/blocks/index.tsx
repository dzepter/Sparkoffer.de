/**
 * BlockRenderer: rendert einen content_block anhand seines block_type (§13).
 * Die config wird IMMER mit Zod (@handel-offensiv/validation) geparst;
 * ungültige Konfigurationen zeigen einen verständlichen Hinweis statt
 * zu crashen oder technische Details preiszugeben.
 */
import { safeParseBlockConfig } from "@handel-offensiv/validation";
import type { ContentBlockRow } from "@handel-offensiv/types";
import { Banner } from "../../../ui";
import { TextBlock } from "./TextBlock";
import { VideoBlock } from "./VideoBlock";
import { AudioBlock } from "./AudioBlock";
import { PdfBlock } from "./PdfBlock";
import { ImageBlock } from "./ImageBlock";
import { ChecklistBlock } from "./ChecklistBlock";
import { ReflectionBlock } from "./ReflectionBlock";
import { SingleChoiceBlock } from "./SingleChoiceBlock";
import { MultipleChoiceBlock } from "./MultipleChoiceBlock";
import { QuizBlock } from "./QuizBlock";
import { ScaleBlock } from "./ScaleBlock";
import { TransferTaskBlock } from "./TransferTaskBlock";
import { DownloadBlock } from "./DownloadBlock";
import { ExternalLinkBlock } from "./ExternalLinkBlock";

export interface BlockRendererProps {
  block: ContentBlockRow;
  profileId: string;
  cohortId: string;
  /** Interaktive Blöcke melden hier ihren Bearbeitungsstand */
  onDoneChange: (blockId: string, done: boolean) => void;
}

function InvalidConfig() {
  return (
    <Banner
      kind="info"
      message="Dieser Inhalt kann gerade nicht angezeigt werden."
    />
  );
}

export function BlockRenderer({
  block,
  profileId,
  cohortId,
  onDoneChange,
}: BlockRendererProps) {
  switch (block.block_type) {
    case "text": {
      const p = safeParseBlockConfig("text", block.config);
      return p.success ? <TextBlock config={p.data} /> : <InvalidConfig />;
    }
    case "video": {
      const p = safeParseBlockConfig("video", block.config);
      return p.success ? <VideoBlock config={p.data} /> : <InvalidConfig />;
    }
    case "audio": {
      const p = safeParseBlockConfig("audio", block.config);
      return p.success ? <AudioBlock config={p.data} /> : <InvalidConfig />;
    }
    case "pdf": {
      const p = safeParseBlockConfig("pdf", block.config);
      return p.success ? <PdfBlock config={p.data} /> : <InvalidConfig />;
    }
    case "image": {
      const p = safeParseBlockConfig("image", block.config);
      return p.success ? <ImageBlock config={p.data} /> : <InvalidConfig />;
    }
    case "checklist": {
      const p = safeParseBlockConfig("checklist", block.config);
      return p.success ? (
        <ChecklistBlock
          blockId={block.id}
          profileId={profileId}
          config={p.data}
          onDoneChange={onDoneChange}
        />
      ) : (
        <InvalidConfig />
      );
    }
    case "reflection": {
      const p = safeParseBlockConfig("reflection", block.config);
      return p.success ? (
        <ReflectionBlock
          blockId={block.id}
          profileId={profileId}
          cohortId={cohortId}
          config={p.data}
          onDoneChange={onDoneChange}
        />
      ) : (
        <InvalidConfig />
      );
    }
    case "single_choice": {
      const p = safeParseBlockConfig("single_choice", block.config);
      return p.success ? (
        <SingleChoiceBlock
          blockId={block.id}
          profileId={profileId}
          config={p.data}
          onDoneChange={onDoneChange}
        />
      ) : (
        <InvalidConfig />
      );
    }
    case "multiple_choice": {
      const p = safeParseBlockConfig("multiple_choice", block.config);
      return p.success ? (
        <MultipleChoiceBlock
          blockId={block.id}
          profileId={profileId}
          config={p.data}
          onDoneChange={onDoneChange}
        />
      ) : (
        <InvalidConfig />
      );
    }
    case "quiz": {
      const p = safeParseBlockConfig("quiz", block.config);
      return p.success ? (
        <QuizBlock
          blockId={block.id}
          profileId={profileId}
          config={p.data}
          onDoneChange={onDoneChange}
        />
      ) : (
        <InvalidConfig />
      );
    }
    case "scale": {
      const p = safeParseBlockConfig("scale", block.config);
      return p.success ? (
        <ScaleBlock
          blockId={block.id}
          profileId={profileId}
          config={p.data}
          onDoneChange={onDoneChange}
        />
      ) : (
        <InvalidConfig />
      );
    }
    case "transfer_task": {
      const p = safeParseBlockConfig("transfer_task", block.config);
      return p.success ? (
        <TransferTaskBlock
          blockId={block.id}
          profileId={profileId}
          cohortId={cohortId}
          config={p.data}
          onDoneChange={onDoneChange}
        />
      ) : (
        <InvalidConfig />
      );
    }
    case "download": {
      const p = safeParseBlockConfig("download", block.config);
      return p.success ? <DownloadBlock config={p.data} /> : <InvalidConfig />;
    }
    case "external_link": {
      const p = safeParseBlockConfig("external_link", block.config);
      return p.success ? <ExternalLinkBlock config={p.data} /> : <InvalidConfig />;
    }
  }
}
