/** multiple_choice-Block (§13) – dünner Wrapper um die Choice-Basis. */
import type { BlockConfigMap } from "@handel-offensiv/validation";
import { ChoiceBase } from "./choice-base";

export interface MultipleChoiceBlockProps {
  blockId: string;
  profileId: string;
  config: BlockConfigMap["multiple_choice"];
  onDoneChange: (blockId: string, done: boolean) => void;
}

export function MultipleChoiceBlock({
  blockId,
  profileId,
  config,
  onDoneChange,
}: MultipleChoiceBlockProps) {
  return (
    <ChoiceBase
      blockId={blockId}
      profileId={profileId}
      question={config.question}
      options={config.options}
      explanation={config.explanation}
      multiple
      onDoneChange={onDoneChange}
    />
  );
}
