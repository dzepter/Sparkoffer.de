/**
 * transfer_task-Block (§13): Beschreibung, Fälligkeit, ERLEDIGT-Markierung
 * mit optionalem Nachweis (Text / Foto / Datei je Konfiguration) und
 * Sichtbarkeitswahl -> assignment_submissions (unique je Block + Profil).
 *
 * Foto/Datei: Upload in den Bucket "learning-assets" unter
 * organizations/{orgId}/submissions/{profileId}/… – HINWEIS: die aktuelle
 * Storage-RLS erlaubt Teilnehmer-Uploads noch nicht (nur SELECT); der
 * Fehlerfall wird verständlich abgefangen (siehe offene Punkte).
 * Text-Entwurf wird vor dem Submit lokal gepuffert (§34).
 */
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing, touch } from "@handel-offensiv/config";
import type { AssignmentSubmissionRow, VisibilityLevel } from "@handel-offensiv/types";
import { submissionSchema, type BlockConfigMap } from "@handel-offensiv/validation";
import { Banner, Button, Card, Skeleton, TagPill, Text, archivoFamily } from "../../../ui";
import { supabase } from "../../../lib/supabase";
import { clearDraft, loadDraft, saveDraft } from "../local-state";
import { LEARNING_ASSETS_BUCKET } from "../storage";
import { MarkdownLight } from "./TextBlock";
import { formatDue } from "../format";

export interface TransferTaskBlockProps {
  blockId: string;
  profileId: string;
  cohortId: string;
  config: BlockConfigMap["transfer_task"];
  onDoneChange: (blockId: string, done: boolean) => void;
}

interface PickedFile {
  uri: string;
  name: string;
  mime: string;
}

const UPLOAD_ERROR =
  "Der Datei-Upload ist gerade nicht möglich. Sie können die Aufgabe auch ohne Datei als erledigt markieren.";

export function TransferTaskBlock({
  blockId,
  profileId,
  cohortId,
  config,
  onDoneChange,
}: TransferTaskBlockProps) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<VisibilityLevel>("private");
  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const submissionQuery = useQuery({
    queryKey: ["submission", blockId, profileId],
    queryFn: async (): Promise<AssignmentSubmissionRow | null> => {
      const res = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("content_block_id", blockId)
        .eq("profile_id", profileId)
        .maybeSingle();
      if (res.error) {
        throw new Error(
          "Der Inhalt konnte gerade nicht geladen werden. Bitte versuchen Sie es erneut.",
        );
      }
      return (res.data as AssignmentSubmissionRow | null) ?? null;
    },
  });
  const submission = submissionQuery.data ?? null;

  useEffect(() => {
    if (hydrated || submissionQuery.isLoading) return;
    let mounted = true;
    void (async () => {
      if (submission !== null) {
        if (!mounted) return;
        setNote(submission.note_text ?? "");
        setVisibility(submission.visibility);
        setHydrated(true);
        return;
      }
      const draft = await loadDraft(profileId, blockId);
      if (!mounted) return;
      if (draft !== null) setNote(draft);
      setHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, [hydrated, submissionQuery.isLoading, submission, profileId, blockId]);

  useEffect(() => {
    onDoneChange(blockId, submission !== null);
  }, [submission, blockId, onDoneChange]);

  const pickImage = async (): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    const asset = result.assets?.[0];
    if (result.canceled || asset === undefined) return;
    setPicked({
      uri: asset.uri,
      name: asset.fileName ?? `foto-${Date.now()}.jpg`,
      mime: asset.mimeType ?? "image/jpeg",
    });
  };

  const pickFile = async (): Promise<void> => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    const asset = result.assets?.[0];
    if (result.canceled || asset === undefined) return;
    setPicked({
      uri: asset.uri,
      name: asset.name,
      mime: asset.mimeType ?? "application/octet-stream",
    });
  };

  const submitMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      let filePath: string | undefined;

      if (picked !== null) {
        // organization_id der Cohort für den Storage-Pfad ermitteln
        const cohortRes = await supabase
          .from("cohorts")
          .select("organization_id")
          .eq("id", cohortId)
          .maybeSingle();
        if (cohortRes.error || cohortRes.data === null) {
          throw new Error(UPLOAD_ERROR);
        }
        const orgId = (cohortRes.data as { organization_id: string }).organization_id;
        const safeName = picked.name.replace(/[^A-Za-z0-9._-]/g, "_");
        const path = `organizations/${orgId}/submissions/${profileId}/${blockId}/${Date.now()}-${safeName}`;
        const response = await fetch(picked.uri);
        const bytes = await response.arrayBuffer();
        const upload = await supabase.storage
          .from(LEARNING_ASSETS_BUCKET)
          .upload(path, bytes, { contentType: picked.mime });
        if (upload.error !== null) {
          throw new Error(UPLOAD_ERROR);
        }
        filePath = path;
      }

      const trimmed = note.trim();
      // Zod-Validierung, sobald ein Nachweis vorliegt; die reine
      // ERLEDIGT-Markierung ohne Nachweis ist bewusst erlaubt.
      if (trimmed.length > 0 || filePath !== undefined) {
        const parsed = submissionSchema.safeParse({
          contentBlockId: blockId,
          cohortId,
          noteText: trimmed.length > 0 ? trimmed : undefined,
          filePath,
          visibility,
        });
        if (!parsed.success) {
          throw new Error("Bitte prüfen Sie Ihren Nachweis und versuchen Sie es erneut.");
        }
      }

      const { error } = await supabase.from("assignment_submissions").upsert(
        {
          content_block_id: blockId,
          profile_id: profileId,
          cohort_id: cohortId,
          status: "submitted",
          note_text: trimmed.length > 0 ? trimmed : null,
          file_path: filePath ?? submission?.file_path ?? null,
          visibility,
        },
        { onConflict: "content_block_id,profile_id" },
      );
      if (error !== null) {
        throw new Error(
          "Ihre Abgabe konnte gerade nicht gespeichert werden. Ihr Entwurf bleibt auf diesem Gerät erhalten – bitte versuchen Sie es erneut.",
        );
      }
    },
    onSuccess: () => {
      void clearDraft(profileId, blockId);
      setPicked(null);
      void queryClient.invalidateQueries({ queryKey: ["submission", blockId] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const changeNote = (text: string): void => {
    setNote(text);
    void saveDraft(profileId, blockId, text);
  };

  const dueLabel =
    config.dueMode === "fixed" && config.dueAt !== undefined
      ? formatDue(config.dueAt)
      : config.dueMode === "days_after_release" && config.dueDays !== undefined
        ? `Fällig ${config.dueDays} ${config.dueDays === 1 ? "Tag" : "Tage"} nach Freischaltung`
        : null;

  return (
    <Card>
      <View style={styles.stack}>
        <View style={styles.metaRow}>
          <TagPill label="Transferaufgabe" tone="green" />
          {submission !== null ? <TagPill label="Erledigt" /> : null}
        </View>
        <Text variant="h3">{config.title}</Text>
        {dueLabel !== null ? (
          <Text variant="small" color={colors.warning}>
            {dueLabel}
          </Text>
        ) : null}
        <MarkdownLight source={config.description} />

        {submissionQuery.isLoading ? (
          <Skeleton height={100} />
        ) : (
          <>
            {config.evidence.text ? (
              <TextInput
                multiline
                value={note}
                onChangeText={changeNote}
                placeholder="Kurzer Nachweis: Was haben Sie umgesetzt?"
                placeholderTextColor={colors.inkSoft}
                accessibilityLabel="Textnachweis zur Transferaufgabe"
                style={styles.input}
                textAlignVertical="top"
              />
            ) : null}

            {(config.evidence.image || config.evidence.file) ? (
              <View style={styles.attachRow}>
                {config.evidence.image ? (
                  <Button
                    label="Foto wählen"
                    variant="secondary"
                    style={styles.attachButton}
                    onPress={() => void pickImage()}
                  />
                ) : null}
                {config.evidence.file ? (
                  <Button
                    label="Datei wählen"
                    variant="secondary"
                    style={styles.attachButton}
                    onPress={() => void pickFile()}
                  />
                ) : null}
              </View>
            ) : null}
            {picked !== null ? (
              <View style={styles.pickedRow}>
                <Feather name="paperclip" size={16} color={colors.inkSoft} />
                <Text variant="small" muted numberOfLines={1} style={styles.pickedName}>
                  {picked.name}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Anhang entfernen"
                  onPress={() => setPicked(null)}
                  style={styles.removePicked}
                >
                  <Feather name="x" size={18} color={colors.inkSoft} />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.visibilityRow}>
              {(["private", "trainer"] as const).map((v) => {
                const selected = visibility === v;
                return (
                  <Pressable
                    key={v}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={v === "private" ? "Privat" : "Für Trainer sichtbar"}
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
            <Text variant="small" muted>
              {visibility === "private"
                ? "Ihre Abgabe ist privat – nur Sie können sie sehen."
                : "Ihre Abgabe ist für Ihren Trainer sichtbar."}
            </Text>

            {submitMutation.isError ? (
              <Banner
                kind="error"
                message={
                  submitMutation.error instanceof Error
                    ? submitMutation.error.message
                    : undefined
                }
                onRetry={() => submitMutation.mutate()}
              />
            ) : null}
            {submitMutation.isSuccess ? (
              <Banner kind="success" message="Ihre Abgabe wurde gespeichert." />
            ) : null}

            <Button
              label={submission !== null ? "Abgabe aktualisieren" : "Als erledigt markieren"}
              loading={submitMutation.isPending}
              onPress={() => submitMutation.mutate()}
            />
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.base,
    backgroundColor: colors.white,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: archivoFamily("400"),
    color: colors.ink,
  },
  attachRow: { flexDirection: "row", gap: spacing.sm },
  attachButton: { flex: 1 },
  pickedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pickedName: { flex: 1 },
  removePicked: {
    minWidth: touch.minTarget,
    minHeight: touch.minTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  visibilityRow: { flexDirection: "row", gap: spacing.sm },
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
