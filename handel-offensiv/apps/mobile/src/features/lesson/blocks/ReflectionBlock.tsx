/**
 * reflection-Block (§13): Freitext mit Sichtbarkeitshinweis und -wahl
 * (falls erlaubt). Insert/Update in reflection_entries (unique je
 * Block + Profil), Entwurf wird VOR dem Submit lokal gepuffert (§34).
 * Eingaben werden mit Zod (@handel-offensiv/validation) validiert.
 */
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing, touch } from "@handel-offensiv/config";
import type { ReflectionEntryRow, VisibilityLevel } from "@handel-offensiv/types";
import { reflectionAnswerSchema, type BlockConfigMap } from "@handel-offensiv/validation";
import { Banner, Button, Card, Skeleton, Text, archivoFamily } from "../../../ui";
import { supabase } from "../../../lib/supabase";
import { clearDraft, loadDraft, saveDraft } from "../local-state";

export interface ReflectionBlockProps {
  blockId: string;
  profileId: string;
  cohortId: string;
  config: BlockConfigMap["reflection"];
  onDoneChange: (blockId: string, done: boolean) => void;
}

function visibilityHint(v: VisibilityLevel): string {
  return v === "private"
    ? "Ihre Antwort ist privat – nur Sie können sie lesen."
    : "Ihre Antwort ist für Ihren Trainer sichtbar.";
}

export function ReflectionBlock({
  blockId,
  profileId,
  cohortId,
  config,
  onDoneChange,
}: ReflectionBlockProps) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<VisibilityLevel>(config.visibilityDefault);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const entryQuery = useQuery({
    queryKey: ["reflection-entry", blockId, profileId],
    queryFn: async (): Promise<ReflectionEntryRow | null> => {
      const res = await supabase
        .from("reflection_entries")
        .select("*")
        .eq("content_block_id", blockId)
        .eq("profile_id", profileId)
        .maybeSingle();
      if (res.error) {
        throw new Error(
          "Der Inhalt konnte gerade nicht geladen werden. Bitte versuchen Sie es erneut.",
        );
      }
      return (res.data as ReflectionEntryRow | null) ?? null;
    },
  });

  const entry = entryQuery.data ?? null;

  // Initialbefüllung: gespeicherter Eintrag > lokaler Entwurf
  useEffect(() => {
    if (hydrated || entryQuery.isLoading) return;
    let mounted = true;
    void (async () => {
      if (entry !== null) {
        if (!mounted) return;
        setBody(entry.body);
        setVisibility(entry.visibility);
        setHydrated(true);
        return;
      }
      const draft = await loadDraft(profileId, blockId);
      if (!mounted) return;
      if (draft !== null) setBody(draft);
      setHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, [hydrated, entryQuery.isLoading, entry, profileId, blockId]);

  useEffect(() => {
    onDoneChange(blockId, entry !== null);
  }, [entry, blockId, onDoneChange]);

  const saveMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      const parsed = reflectionAnswerSchema.safeParse({
        contentBlockId: blockId,
        cohortId,
        body: body.trim(),
        visibility,
      });
      if (!parsed.success) {
        throw new Error("Bitte schreiben Sie zuerst eine Antwort.");
      }
      const { error } = await supabase.from("reflection_entries").upsert(
        {
          content_block_id: parsed.data.contentBlockId,
          profile_id: profileId,
          cohort_id: parsed.data.cohortId,
          body: parsed.data.body,
          visibility: parsed.data.visibility,
        },
        { onConflict: "content_block_id,profile_id" },
      );
      if (error !== null) {
        throw new Error(
          "Ihre Antwort konnte gerade nicht gespeichert werden. Ihr Entwurf bleibt auf diesem Gerät erhalten – bitte versuchen Sie es erneut.",
        );
      }
    },
    onSuccess: () => {
      void clearDraft(profileId, blockId);
      void queryClient.invalidateQueries({ queryKey: ["reflection-entry", blockId] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const changeText = (text: string): void => {
    setBody(text);
    setValidationError(null);
    // Entwurf lokal puffern (§34) – bewusst bei jedem Tastendruck, klein
    void saveDraft(profileId, blockId, text);
  };

  const submit = (): void => {
    if (body.trim().length === 0) {
      setValidationError("Bitte schreiben Sie zuerst eine Antwort.");
      return;
    }
    setValidationError(null);
    saveMutation.mutate();
  };

  return (
    <Card>
      <View style={styles.stack}>
        <Text variant="h3">{config.question}</Text>

        {entryQuery.isLoading ? (
          <Skeleton height={100} />
        ) : (
          <>
            <TextInput
              multiline
              value={body}
              onChangeText={changeText}
              placeholder="Ihre Gedanken …"
              placeholderTextColor={colors.inkSoft}
              accessibilityLabel={`Antwort auf: ${config.question}`}
              style={styles.input}
              textAlignVertical="top"
            />

            {config.allowVisibilityChoice ? (
              <View style={styles.visibilityRow}>
                {(["private", "trainer"] as const).map((v) => {
                  const selected = visibility === v;
                  return (
                    <Pressable
                      key={v}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={
                        v === "private" ? "Privat" : "Für Trainer sichtbar"
                      }
                      onPress={() => setVisibility(v)}
                      style={({ pressed }) => [
                        styles.visibilityOption,
                        selected && styles.visibilityOptionSelected,
                        { opacity: pressed ? 0.8 : 1 },
                      ]}
                    >
                      <Feather
                        name={v === "private" ? "lock" : "eye"}
                        size={16}
                        color={selected ? colors.dark : colors.inkSoft}
                      />
                      <Text
                        variant="small"
                        color={selected ? colors.dark : colors.inkSoft}
                        style={styles.visibilityLabel}
                      >
                        {v === "private" ? "Privat" : "Für Trainer"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <Text variant="small" muted>
              {visibilityHint(visibility)}
            </Text>

            {validationError !== null ? (
              <Text variant="small" color={colors.danger} accessibilityLiveRegion="polite">
                {validationError}
              </Text>
            ) : null}
            {saveMutation.isError ? (
              <Banner
                kind="error"
                message={
                  saveMutation.error instanceof Error
                    ? saveMutation.error.message
                    : undefined
                }
                onRetry={submit}
              />
            ) : null}
            {saveMutation.isSuccess ? (
              <Banner kind="success" message="Ihre Antwort wurde gespeichert." />
            ) : null}

            <Button
              label={entry !== null ? "Antwort aktualisieren" : "Antwort speichern"}
              loading={saveMutation.isPending}
              onPress={submit}
            />
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    backgroundColor: colors.white,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: archivoFamily("400"),
    color: colors.ink,
  },
  visibilityRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  visibilityOption: {
    minHeight: touch.minTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  visibilityOptionSelected: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  visibilityLabel: {
    fontFamily: archivoFamily("700"),
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
