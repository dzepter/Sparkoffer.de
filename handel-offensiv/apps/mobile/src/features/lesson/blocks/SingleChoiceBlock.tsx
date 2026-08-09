/** single_choice-Block (§13) – dünner Wrapper um die Choice-Basis. */
import type { BlockConfigMap } from "@handel-offensiv/validation";
import { ChoiceBase } from "./choice-base";

export interface SingleChoiceBlockProps {
  blockId: string;
  profileId: string;
  config: BlockConfigMap["single_choice"];
  onDoneChange: (blockId: string, done: boolean) => void;
}

export function SingleChoiceBlock({
  blockId,
  profileId,
  config,
  onDoneChange,
}: SingleChoiceBlockProps) {
  return (
    <ChoiceBase
      blockId={blockId}
      profileId={profileId}
      question={config.question}
      options={config.options}
      explanation={config.explanation}
      multiple={false}
      onDoneChange={onDoneChange}
    />
  );
}
