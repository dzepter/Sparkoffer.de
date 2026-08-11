/**
 * Gemeinsame Basis für single_choice / multiple_choice (§13):
 * Inline-Frage mit Auflösung und Erklärung. Antwort + Auflösung werden
 * lokal persistiert (AsyncStorage); Korrektheit wird zusätzlich zum
 * Icon als Text ausgegeben (keine reine Farbcodierung, §36).
 */
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, spacing, touch } from "@handel-offensiv/config";
import { Banner, Button, Card, Text } from "../../../ui";
import { usePersistedBlockState } from "../local-state";

interface ChoiceOption {
  id: string;
  label: string;
  correct?: boolean | undefined;
}

export interface ChoiceBaseProps {
  blockId: string;
  profileId: string;
  question: string;
  options: ChoiceOption[];
  explanation?: string | undefined;
  multiple: boolean;
  onDoneChange: (blockId: string, done: boolean) => void;
}

interface ChoiceState {
  selectedIds: string[];
  revealed: boolean;
}

export function ChoiceBase({
  blockId,
  profileId,
  question,
  options,
  explanation,
  multiple,
  onDoneChange,
}: ChoiceBaseProps) {
  const [state, setState, hydrated] = usePersistedBlockState<ChoiceState>(
    profileId,
    blockId,
    { selectedIds: [], revealed: false },
  );
  const selected = new Set(state.selectedIds);

  useEffect(() => {
    if (hydrated) onDoneChange(blockId, state.revealed);
  }, [hydrated, state.revealed, blockId, onDoneChange]);

  const correctIds = new Set(options.filter((o) => o.correct === true).map((o) => o.id));
  const isCorrect =
    selected.size === correctIds.size && [...selected].every((id) => correctIds.has(id));

  const toggle = (optionId: string): void => {
    if (state.revealed) return;
    let next: Set<string>;
    if (multiple) {
      next = new Set(selected);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
    } else {
      next = new Set([optionId]);
    }
    setState({ selectedIds: [...next], revealed: false });
  };

  return (
    <Card>
      <View style={styles.stack}>
        <Text variant="h3">{question}</Text>
        <Text variant="small" muted>
          {multiple ? "Mehrere Antworten möglich." : "Eine Antwort wählen."}
        </Text>
        <View>
          {options.map((option) => {
            const isSelected = selected.has(option.id);
            const showAsCorrect = state.revealed && correctIds.has(option.id);
            const showAsWrong = state.revealed && isSelected && !correctIds.has(option.id);
            const baseIcon = multiple
              ? isSelected
                ? "check-square"
                : "square"
              : isSelected
                ? "disc"
                : "circle";
            return (
              <Pressable
                key={option.id}
                accessibilityRole={multiple ? "checkbox" : "radio"}
                accessibilityState={{ checked: isSelected, disabled: state.revealed }}
                accessibilityLabel={
                  state.revealed
                    ? `${option.label}. ${showAsCorrect ? "Richtige Antwort." : showAsWrong ? "Nicht richtig." : ""}`
                    : option.label
                }
                disabled={state.revealed}
                onPress={() => toggle(option.id)}
                style={({ pressed }) => [styles.option, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Feather
                  name={
                    showAsCorrect ? "check-circle" : showAsWrong ? "x-circle" : baseIcon
                  }
                  size={22}
                  color={
                    showAsCorrect
                      ? colors.success
                      : showAsWrong
                        ? colors.danger
                        : isSelected
                          ? colors.greenDeep
                          : colors.inkSoft
                  }
                />
                <View style={styles.optionText}>
                  <Text variant="body">{option.label}</Text>
                  {showAsCorrect ? (
                    <Text variant="small" color={colors.success}>
                      Richtige Antwort
                    </Text>
                  ) : showAsWrong ? (
                    <Text variant="small" color={colors.danger}>
                      Nicht richtig
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {!state.revealed ? (
          <Button
            label="Antwort prüfen"
            variant="secondary"
            disabled={selected.size === 0}
            onPress={() => setState({ selectedIds: [...selected], revealed: true })}
          />
        ) : (
          <>
            <Banner
              kind={isCorrect ? "success" : "info"}
              message={
                isCorrect
                  ? "Richtig beantwortet."
                  : "Nicht ganz – sehen Sie sich die Auflösung an."
              }
            />
            {explanation !== undefined && explanation.length > 0 ? (
              <Text variant="small" muted>
                {explanation}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  option: {
    minHeight: touch.minTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  optionText: { flex: 1, gap: 2 },
});
