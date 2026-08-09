/**
 * OFFENSIVPLAN (Briefing §14): je Modul eine Plan-Karte mit den fünf Feldern
 * MEINE ERKENNTNIS / MEIN VERHALTEN / MEINE MASSNAHME / MEINE MANNSCHAFT /
 * MEIN ERGEBNIS, Status-Stepper (geplant → begonnen → umgesetzt → reflektiert),
 * Toggle "Mit Trainer teilen" sowie – nach Modul 05 – MEIN 90-TAGE-OFFENSIVPLAN
 * mit konsolidierter Ansicht, eigenen Vorhaben und PDF-Export.
 *
 * SICHERHEIT: Eingaben werden mit Zod (actionPlanItemSchema) validiert;
 * Schreibrechte erzwingt ausschließlich die DB via RLS (nur eigene Pläne,
 * Trainer sehen Pläne nur bei share_with_trainer = true).
 * OFFLINE (§34): Entwürfe werden vor dem Submit in AsyncStorage gepuffert.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Alert, Pressable, StyleSheet, Switch, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { onlineManager, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { colors, radius, spacing, touch } from "@handel-offensiv/config";
import { actionPlanItemSchema } from "@handel-offensiv/validation";
import type { ActionPlanItemRow, ModuleRow, PlanItemStatus } from "@handel-offensiv/types";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../lib/auth-context";
import {
  Banner,
  Button,
  Card,
  Field,
  Kicker,
  ModuleNumber,
  Screen,
  Skeleton,
  TagPill,
  Text,
} from "../../ui";
import {
  PLAN_FIELDS,
  STATUS_STEPS,
  draftKey,
  emptyFieldValues,
  fieldValuesFromItem,
  primaryItem,
  sortedItems,
  statusLabel,
  type PlanFieldValues,
  type PlanWithItems,
} from "./shared";
import { exportOffensivplanPdf, type PdfExportResult } from "./pdf";

/* ------------------------------- Daten --------------------------------- */

interface OffensivplanData {
  modules: ModuleRow[];
  plans: PlanWithItems[];
  /** 90-Tage-Bereich sichtbar (Modul 05 begonnen oder Plan existiert) */
  show90: boolean;
}

async function fetchOffensivplan(cohortId: string, profileId: string): Promise<OffensivplanData> {
  const cohortRes = await supabase
    .from("cohorts")
    .select("program_id")
    .eq("id", cohortId)
    .maybeSingle();
  if (cohortRes.error) throw cohortRes.error;
  const programId = (cohortRes.data as { program_id: string } | null)?.program_id ?? null;

  let modules: ModuleRow[] = [];
  if (programId !== null) {
    const modulesRes = await supabase
      .from("modules")
      .select("*")
      .eq("program_id", programId)
      .order("position", { ascending: true });
    if (modulesRes.error) throw modulesRes.error;
    modules = (modulesRes.data as ModuleRow[] | null) ?? [];
  }

  const plansRes = await supabase
    .from("action_plans")
    .select("*, action_plan_items(*)")
    .eq("cohort_id", cohortId)
    .eq("profile_id", profileId);
  if (plansRes.error) throw plansRes.error;
  const plans = (plansRes.data as PlanWithItems[] | null) ?? [];

  // Freischaltung des 90-Tage-Bereichs: letzter Präsenztag (Modul 05) hat
  // begonnen ODER es existiert bereits ein 90-Tage-Plan.
  let show90 = plans.some((p) => p.module_id === null);
  const lastModule = modules[modules.length - 1];
  if (!show90 && lastModule !== undefined) {
    const sessionsRes = await supabase
      .from("cohort_sessions")
      .select("module_id, starts_at")
      .eq("cohort_id", cohortId)
      .eq("module_id", lastModule.id);
    if (!sessionsRes.error) {
      const nowMs = Date.now();
      const rows = (sessionsRes.data as { module_id: string; starts_at: string }[] | null) ?? [];
      show90 = rows.some((s) => Date.parse(s.starts_at) <= nowMs);
    }
  }

  return { modules, plans, show90 };
}

function useIsOnline(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => onlineManager.subscribe(onStoreChange),
    () => onlineManager.isOnline(),
  );
}

/* ------------------------------- Screen -------------------------------- */

export default function OffensivplanScreen() {
  const { activeCohortId, session, profile } = useSession();
  const profileId = session?.user.id ?? null;
  const isOnline = useIsOnline();
  const queryClient = useQueryClient();

  /** Welcher Editor ist offen? "<moduleId>" | "90:<itemId>" | "90:neu" */
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exporting, setExporting] = useState(false);

  const showFlash = useCallback((kind: "success" | "error", message: string) => {
    setFlash({ kind, message });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 4000);
  }, []);
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  const enabled = activeCohortId !== null && profileId !== null;
  const query = useQuery({
    queryKey: ["offensivplan", activeCohortId, profileId],
    queryFn: () => fetchOffensivplan(activeCohortId as string, profileId as string),
    enabled,
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["offensivplan", activeCohortId, profileId] }),
    [queryClient, activeCohortId, profileId],
  );

  const planFor = useCallback(
    (moduleId: string | null): PlanWithItems | undefined =>
      (query.data?.plans ?? []).find((p) => p.module_id === moduleId),
    [query.data],
  );

  /** Plan sicherstellen (Upsert auf profile_id/cohort_id/module_id). */
  const ensurePlan = useCallback(
    async (moduleId: string | null): Promise<{ id: string }> => {
      const existing = planFor(moduleId);
      if (existing) return existing;
      const { data, error } = await supabase
        .from("action_plans")
        .upsert(
          { profile_id: profileId, cohort_id: activeCohortId, module_id: moduleId },
          { onConflict: "profile_id,cohort_id,module_id" },
        )
        .select("id")
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    [planFor, profileId, activeCohortId],
  );

  /* ------------------------------ Mutationen --------------------------- */

  const saveItem = useMutation({
    mutationFn: async (input: {
      moduleId: string | null;
      itemId: string | null;
      position: number;
      values: PlanFieldValues;
      status: PlanItemStatus;
    }) => {
      const toNull = (v: string) => (v.trim().length > 0 ? v.trim() : null);
      const row = {
        insight: toNull(input.values.insight),
        behavior: toNull(input.values.behavior),
        action: input.values.action.trim(),
        team: toNull(input.values.team),
        result: toNull(input.values.result),
        status: input.status,
      };
      if (input.itemId !== null) {
        const { error } = await supabase
          .from("action_plan_items")
          .update(row)
          .eq("id", input.itemId);
        if (error) throw error;
      } else {
        const plan = await ensurePlan(input.moduleId);
        const { error } = await supabase
          .from("action_plan_items")
          .insert({ action_plan_id: plan.id, position: input.position, ...row });
        if (error) throw error;
      }
      return input;
    },
    onSuccess: async (input) => {
      if (activeCohortId) {
        await AsyncStorage.removeItem(draftKey(activeCohortId, input.moduleId, input.itemId));
      }
      setEditingKey(null);
      showFlash("success", "Ihr Plan wurde gespeichert.");
      await invalidate();
    },
    onError: () => {
      // Entwurf bleibt in AsyncStorage erhalten – nichts geht verloren.
      showFlash(
        "error",
        "Ihr Plan konnte gerade nicht gespeichert werden. Ihr Entwurf bleibt erhalten – bitte versuchen Sie es erneut.",
      );
    },
  });

  const setStatus = useMutation({
    mutationFn: async (input: { itemId: string; status: PlanItemStatus }) => {
      const { error } = await supabase
        .from("action_plan_items")
        .update({ status: input.status })
        .eq("id", input.itemId);
      if (error) throw error;
    },
    onSuccess: () => void invalidate(),
    onError: () =>
      showFlash(
        "error",
        "Der Status konnte gerade nicht geändert werden. Bitte versuchen Sie es erneut.",
      ),
  });

  const toggleShare = useMutation({
    mutationFn: async (input: { moduleId: string | null; share: boolean }) => {
      const { error } = await supabase
        .from("action_plans")
        .upsert(
          {
            profile_id: profileId,
            cohort_id: activeCohortId,
            module_id: input.moduleId,
            share_with_trainer: input.share,
          },
          { onConflict: "profile_id,cohort_id,module_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => void invalidate(),
    onError: () =>
      showFlash(
        "error",
        "Die Freigabe konnte gerade nicht geändert werden. Bitte versuchen Sie es erneut.",
      ),
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("action_plan_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => void invalidate(),
    onError: () =>
      showFlash(
        "error",
        "Das Vorhaben konnte gerade nicht entfernt werden. Bitte versuchen Sie es erneut.",
      ),
  });

  const onExportPdf = async () => {
    if (!query.data) return;
    setExporting(true);
    const modulePlans = query.data.modules.map((module) => ({
      numberLabel: module.number_label,
      title: module.title,
      item: primaryItem(planFor(module.id)),
    }));
    const name =
      profile && (profile.first_name || profile.last_name)
        ? [profile.first_name, profile.last_name].filter(Boolean).join(" ")
        : null;
    const result: PdfExportResult = await exportOffensivplanPdf({
      participantName: name,
      modulePlans,
      ninetyItems: sortedItems(planFor(null)),
    });
    setExporting(false);
    if (result === "unavailable") {
      showFlash("error", "Teilen ist auf diesem Gerät gerade nicht verfügbar.");
    } else if (result === "error") {
      showFlash(
        "error",
        "Das PDF konnte gerade nicht erstellt werden. Bitte versuchen Sie es erneut.",
      );
    }
  };

  /* -------------------------------- Render ----------------------------- */

  const data = query.data;
  const ninetyPlan = planFor(null);
  const ninetyItems = sortedItems(ninetyPlan);

  return (
    <Screen>
      <View style={styles.stack}>
        <Kicker>Ihre Umsetzung</Kicker>
        <Text variant="h1">Offensivplan</Text>
        <Text variant="body" muted>
          Halten Sie je Modul fest, was Sie erkannt haben und was Sie konkret
          umsetzen. Ihr Plan ist privat, solange Sie ihn nicht teilen.
        </Text>

        {!isOnline ? <Banner kind="offline" /> : null}
        {flash ? <Banner kind={flash.kind} message={flash.message} /> : null}

        {!enabled ? (
          <Banner
            kind="info"
            message="Ihrem Konto ist noch keine Gruppe zugeordnet. Bitte wenden Sie sich an Ihren Ansprechpartner bei Aigner Offensiv."
          />
        ) : query.isPending ? (
          <View style={styles.stack} accessibilityLabel="Offensivplan wird geladen">
            <Skeleton height={180} />
            <Skeleton height={180} />
            <Skeleton height={180} />
          </View>
        ) : query.isError ? (
          <Banner kind="error" onRetry={() => void query.refetch()} />
        ) : data && data.modules.length === 0 ? (
          <Card>
            <Text variant="h3">Noch keine Module verfügbar</Text>
            <Text variant="body" muted style={styles.emptyBody}>
              Sobald Ihr Programm freigeschaltet ist, legen Sie hier Ihre
              Umsetzungspläne zu den Modulen 01–05 an.
            </Text>
          </Card>
        ) : data ? (
          <>
            {data.modules.map((module) => {
              const plan = planFor(module.id);
              const item = primaryItem(plan);
              return (
                <ModulePlanCard
                  key={module.id}
                  module={module}
                  plan={plan}
                  item={item}
                  editing={editingKey === module.id}
                  draftStorageKey={draftKey(activeCohortId as string, module.id, item?.id ?? null)}
                  saving={saveItem.isPending}
                  onStartEdit={() => setEditingKey(module.id)}
                  onCancelEdit={() => setEditingKey(null)}
                  onSave={(values) =>
                    saveItem.mutate({
                      moduleId: module.id,
                      itemId: item?.id ?? null,
                      position: 0,
                      values,
                      status: item?.status ?? "planned",
                    })
                  }
                  onSelectStatus={(status) => {
                    if (item) setStatus.mutate({ itemId: item.id, status });
                  }}
                  onToggleShare={(share) => toggleShare.mutate({ moduleId: module.id, share })}
                />
              );
            })}

            {/* ---------------- 90-Tage-Offensivplan (§14) ---------------- */}
            {data.show90 ? (
              <View style={styles.section}>
                <Kicker>Nach Modul 05</Kicker>
                <Text variant="h2">Mein 90-Tage-Offensivplan</Text>
                <Text variant="body" muted>
                  Ihre Maßnahmen aus allen Modulen auf einen Blick – ergänzt um
                  eigene Vorhaben für die nächsten 90 Tage.
                </Text>

                <Card style={styles.consolidated}>
                  <Kicker>Maßnahmen aus den Modulen</Kicker>
                  {data.modules.some((m) => primaryItem(planFor(m.id))?.action) ? (
                    data.modules.map((module) => {
                      const item = primaryItem(planFor(module.id));
                      if (!item?.action) return null;
                      return (
                        <View key={module.id} style={styles.consolidatedRow}>
                          <ModuleNumber number={module.number_label} tone="green" size={24} />
                          <View style={styles.consolidatedText}>
                            <Text variant="body">{item.action}</Text>
                            <Text variant="small" muted>
                              Status: {statusLabel(item.status)}
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text variant="body" muted>
                      Noch keine Maßnahmen aus den Modulen – füllen Sie oben
                      Ihre Modul-Pläne aus.
                    </Text>
                  )}
                </Card>

                {ninetyItems.map((item) => (
                  <NinetyItemCard
                    key={item.id}
                    item={item}
                    editing={editingKey === `90:${item.id}`}
                    draftStorageKey={draftKey(activeCohortId as string, null, item.id)}
                    saving={saveItem.isPending}
                    onStartEdit={() => setEditingKey(`90:${item.id}`)}
                    onCancelEdit={() => setEditingKey(null)}
                    onSave={(values) =>
                      saveItem.mutate({
                        moduleId: null,
                        itemId: item.id,
                        position: item.position,
                        values,
                        status: item.status,
                      })
                    }
                    onSelectStatus={(status) => setStatus.mutate({ itemId: item.id, status })}
                    onDelete={() =>
                      Alert.alert(
                        "Vorhaben entfernen?",
                        "Dieses Vorhaben wird aus Ihrem 90-Tage-Offensivplan entfernt.",
                        [
                          { text: "Abbrechen", style: "cancel" },
                          {
                            text: "Entfernen",
                            style: "destructive",
                            onPress: () => deleteItem.mutate(item.id),
                          },
                        ],
                      )
                    }
                  />
                ))}

                {editingKey === "90:neu" ? (
                  <Card style={styles.editorCard}>
                    <Text variant="h3">Neues Vorhaben</Text>
                    <PlanItemEditor
                      draftStorageKey={draftKey(activeCohortId as string, null, null)}
                      initial={emptyFieldValues()}
                      saving={saveItem.isPending}
                      onSave={(values) =>
                        saveItem.mutate({
                          moduleId: null,
                          itemId: null,
                          position: ninetyItems.length,
                          values,
                          status: "planned",
                        })
                      }
                      onCancel={() => setEditingKey(null)}
                    />
                  </Card>
                ) : (
                  <Button
                    label="Vorhaben hinzufügen"
                    variant="secondary"
                    onPress={() => setEditingKey("90:neu")}
                  />
                )}

                <ShareToggle
                  value={ninetyPlan?.share_with_trainer ?? false}
                  disabled={toggleShare.isPending}
                  onChange={(share) => toggleShare.mutate({ moduleId: null, share })}
                />

                <Button
                  label="Als PDF exportieren"
                  variant="dark"
                  loading={exporting}
                  onPress={() => void onExportPdf()}
                />
              </View>
            ) : (
              <Card style={styles.lockedCard}>
                <View style={styles.lockedRow}>
                  <Feather name="clock" size={18} color={colors.inkSoft} />
                  <Text variant="body" muted style={styles.lockedText}>
                    Nach Modul 05 finden Sie hier Ihren 90-Tage-Offensivplan:
                    alle Maßnahmen konsolidiert, ergänzbar und als PDF
                    exportierbar.
                  </Text>
                </View>
              </Card>
            )}
          </>
        ) : null}
      </View>
    </Screen>
  );
}

/* --------------------------- Modul-Plan-Karte --------------------------- */

function ModulePlanCard({
  module,
  plan,
  item,
  editing,
  draftStorageKey,
  saving,
  onStartEdit,
  onCancelEdit,
  onSave,
  onSelectStatus,
  onToggleShare,
}: {
  module: ModuleRow;
  plan: PlanWithItems | undefined;
  item: ActionPlanItemRow | null;
  editing: boolean;
  draftStorageKey: string;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (values: PlanFieldValues) => void;
  onSelectStatus: (status: PlanItemStatus) => void;
  onToggleShare: (share: boolean) => void;
}) {
  return (
    <Card style={styles.moduleCard}>
      <View style={styles.moduleHead}>
        <ModuleNumber
          number={module.number_label}
          tone={item ? "green" : "faint"}
          size={44}
        />
        <View style={styles.moduleHeadText}>
          <Kicker>{`Modul ${module.number_label}`}</Kicker>
          <Text variant="h3">{module.title}</Text>
        </View>
        {item ? <TagPill label={statusLabel(item.status)} tone="green" /> : null}
      </View>

      {editing ? (
        <PlanItemEditor
          draftStorageKey={draftStorageKey}
          initial={fieldValuesFromItem(item)}
          saving={saving}
          onSave={onSave}
          onCancel={onCancelEdit}
        />
      ) : (
        <>
          <View style={styles.fieldList}>
            {PLAN_FIELDS.map((field) => {
              const raw = item?.[field.key] ?? null;
              return (
                <View key={field.key} style={styles.fieldRow}>
                  <Text variant="small" muted style={styles.fieldLabel}>
                    {field.label}
                  </Text>
                  {raw && raw.trim().length > 0 ? (
                    <Text variant="body">{raw}</Text>
                  ) : (
                    <Text variant="body" muted>
                      Noch nicht ausgefüllt
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {item ? (
            <StatusStepper status={item.status} onSelect={onSelectStatus} />
          ) : (
            <Text variant="small" muted>
              Legen Sie Ihren Plan zu diesem Modul an – am besten direkt nach
              dem Offensivtag.
            </Text>
          )}

          <Button
            label={item ? "Bearbeiten" : "Plan anlegen"}
            variant="secondary"
            onPress={onStartEdit}
          />

          <ShareToggle
            value={plan?.share_with_trainer ?? false}
            onChange={onToggleShare}
          />
        </>
      )}
    </Card>
  );
}

/* --------------------------- 90-Tage-Vorhaben --------------------------- */

function NinetyItemCard({
  item,
  editing,
  draftStorageKey,
  saving,
  onStartEdit,
  onCancelEdit,
  onSave,
  onSelectStatus,
  onDelete,
}: {
  item: ActionPlanItemRow;
  editing: boolean;
  draftStorageKey: string;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (values: PlanFieldValues) => void;
  onSelectStatus: (status: PlanItemStatus) => void;
  onDelete: () => void;
}) {
  return (
    <Card style={styles.moduleCard}>
      <View style={styles.moduleHead}>
        <View style={styles.moduleHeadText}>
          <Kicker>Eigenes Vorhaben</Kicker>
          <Text variant="h3">{item.action ?? "Vorhaben"}</Text>
        </View>
        <TagPill label={statusLabel(item.status)} tone="green" />
      </View>

      {editing ? (
        <PlanItemEditor
          draftStorageKey={draftStorageKey}
          initial={fieldValuesFromItem(item)}
          saving={saving}
          onSave={onSave}
          onCancel={onCancelEdit}
        />
      ) : (
        <>
          <View style={styles.fieldList}>
            {PLAN_FIELDS.filter((f) => f.key !== "action").map((field) => {
              const raw = item[field.key];
              if (!raw || raw.trim().length === 0) return null;
              return (
                <View key={field.key} style={styles.fieldRow}>
                  <Text variant="small" muted style={styles.fieldLabel}>
                    {field.label}
                  </Text>
                  <Text variant="body">{raw}</Text>
                </View>
              );
            })}
          </View>
          <StatusStepper status={item.status} onSelect={onSelectStatus} />
          <View style={styles.itemActions}>
            <Button label="Bearbeiten" variant="secondary" onPress={onStartEdit} style={styles.itemActionButton} />
            <Button label="Entfernen" variant="ghost" onPress={onDelete} style={styles.itemActionButton} />
          </View>
        </>
      )}
    </Card>
  );
}

/* ------------------------------- Editor -------------------------------- */

function PlanItemEditor({
  draftStorageKey,
  initial,
  saving,
  onSave,
  onCancel,
}: {
  draftStorageKey: string;
  initial: PlanFieldValues;
  saving: boolean;
  onSave: (values: PlanFieldValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<PlanFieldValues>(initial);
  const [actionError, setActionError] = useState<string | null>(null);

  // Entwurf wiederherstellen (§34) – nur einmal beim Öffnen
  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(draftStorageKey).then((stored) => {
      if (!mounted || stored === null) return;
      try {
        const parsed = JSON.parse(stored) as Partial<PlanFieldValues>;
        setValues((prev) => ({
          insight: typeof parsed.insight === "string" ? parsed.insight : prev.insight,
          behavior: typeof parsed.behavior === "string" ? parsed.behavior : prev.behavior,
          action: typeof parsed.action === "string" ? parsed.action : prev.action,
          team: typeof parsed.team === "string" ? parsed.team : prev.team,
          result: typeof parsed.result === "string" ? parsed.result : prev.result,
        }));
      } catch {
        // Defekter Entwurf: ignorieren, Ausgangswerte behalten
      }
    });
    return () => {
      mounted = false;
    };
  }, [draftStorageKey]);

  const update = (key: keyof PlanFieldValues, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      // Entwurf VOR dem Submit lokal puffern (fire & forget)
      void AsyncStorage.setItem(draftStorageKey, JSON.stringify(next));
      return next;
    });
    if (key === "action") setActionError(null);
  };

  const handleSave = () => {
    const orUndef = (v: string) => (v.trim().length > 0 ? v.trim() : undefined);
    const parsed = actionPlanItemSchema.safeParse({
      insight: orUndef(values.insight),
      behavior: orUndef(values.behavior),
      action: values.action.trim(),
      team: orUndef(values.team),
      result: orUndef(values.result),
    });
    if (!parsed.success) {
      const actionIssue = parsed.error.issues.find((issue) => issue.path[0] === "action");
      setActionError(actionIssue?.message ?? "Bitte prüfen Sie Ihre Eingaben.");
      return;
    }
    onSave(values);
  };

  const handleCancel = () => {
    void AsyncStorage.removeItem(draftStorageKey);
    onCancel();
  };

  return (
    <View style={styles.editor}>
      {PLAN_FIELDS.map((field) => (
        <Field
          key={field.key}
          label={field.label}
          value={values[field.key]}
          onChangeText={(text) => update(field.key, text)}
          placeholder={field.hint}
          multiline
          style={styles.multiline}
          error={field.key === "action" ? actionError : null}
          hint={field.key === "action" ? "Pflichtfeld – Ihr konkreter nächster Schritt" : undefined}
        />
      ))}
      <View style={styles.editorActions}>
        <Button
          label="Speichern"
          variant="primary"
          loading={saving}
          onPress={handleSave}
          style={styles.itemActionButton}
        />
        <Button
          label="Abbrechen"
          variant="ghost"
          disabled={saving}
          onPress={handleCancel}
          style={styles.itemActionButton}
        />
      </View>
    </View>
  );
}

/* ---------------------------- Status-Stepper ---------------------------- */

function StatusStepper({
  status,
  onSelect,
  disabled = false,
}: {
  status: PlanItemStatus;
  onSelect: (status: PlanItemStatus) => void;
  disabled?: boolean;
}) {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.value === status);

  return (
    <View
      style={styles.stepper}
      accessibilityRole="radiogroup"
      accessibilityLabel={`Status: ${statusLabel(status)}`}
    >
      {STATUS_STEPS.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isReached = index < currentIndex;
        return (
          <Pressable
            key={step.value}
            accessibilityRole="radio"
            accessibilityLabel={`Status auf ${step.label} setzen`}
            accessibilityState={{ selected: isCurrent, disabled }}
            disabled={disabled}
            onPress={() => onSelect(step.value)}
            style={({ pressed }) => [
              styles.step,
              isCurrent
                ? styles.stepCurrent
                : isReached
                  ? styles.stepReached
                  : styles.stepFuture,
              { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
            ]}
          >
            {isCurrent || isReached ? (
              <Feather
                name="check"
                size={12}
                color={isCurrent ? colors.greenBright : colors.greenDeep}
              />
            ) : null}
            <Text
              variant="small"
              color={isCurrent ? colors.greenBright : isReached ? colors.greenDeep : colors.inkSoft}
              style={styles.stepLabel}
            >
              {step.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ----------------------------- Share-Toggle ----------------------------- */

function ShareToggle({
  value,
  disabled = false,
  onChange,
}: {
  value: boolean;
  disabled?: boolean;
  onChange: (share: boolean) => void;
}) {
  return (
    <View style={styles.shareRow}>
      <View style={styles.shareText}>
        <Text variant="h3">Mit Trainer teilen</Text>
        <Text variant="small" muted>
          {value
            ? "Ihr Trainer kann diesen Plan sehen und Ihnen Feedback geben. Sie können das Teilen jederzeit beenden."
            : "Standardmäßig privat. Wenn Sie teilen, kann Ihr Trainer diesen Plan sehen und Ihnen Feedback geben."}
        </Text>
      </View>
      <Switch
        accessibilityRole="switch"
        accessibilityLabel="Diesen Plan mit dem Trainer teilen"
        accessibilityState={{ checked: value, disabled }}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ true: colors.green, false: colors.line }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.line}
      />
    </View>
  );
}

/* -------------------------------- Styles ------------------------------- */

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  section: { gap: spacing.md, marginTop: spacing.md },
  emptyBody: { marginTop: spacing.xs },
  moduleCard: { gap: spacing.md },
  moduleHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  moduleHeadText: { flex: 1, gap: 2 },
  fieldList: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  fieldRow: { gap: 2 },
  fieldLabel: { textTransform: "uppercase", letterSpacing: 1.2, fontSize: 11 },
  editor: { gap: spacing.md },
  // Fehlte im StyleSheet (Typecheck-Fix): Karte um den "Neues Vorhaben"-Editor.
  // Einfachste Loesung: gleicher Innenabstand wie moduleCard/editor.
  editorCard: { gap: spacing.md },
  editorActions: { flexDirection: "row", gap: spacing.sm },
  multiline: { minHeight: 72, paddingTop: spacing.sm + 4, textAlignVertical: "top" },
  itemActions: { flexDirection: "row", gap: spacing.sm },
  itemActionButton: { flex: 1 },
  stepper: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  step: {
    minHeight: touch.minTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.base,
    borderWidth: 1,
    paddingHorizontal: spacing.sm + 2,
  },
  stepCurrent: { backgroundColor: colors.dark, borderColor: colors.dark },
  stepReached: { backgroundColor: colors.paper, borderColor: colors.greenDeep },
  stepFuture: { backgroundColor: colors.white, borderColor: colors.line },
  stepLabel: { textTransform: "uppercase", letterSpacing: 1, fontSize: 11 },
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.md,
  },
  shareText: { flex: 1, gap: 2 },
  consolidated: { gap: spacing.md },
  consolidatedRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  consolidatedText: { flex: 1, gap: 2 },
  lockedCard: { backgroundColor: colors.paper },
  lockedRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  lockedText: { flex: 1 },
});
