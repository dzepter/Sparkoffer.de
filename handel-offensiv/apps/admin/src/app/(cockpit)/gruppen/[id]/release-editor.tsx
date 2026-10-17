"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import type { LessonReleaseRow, ReleaseMode } from "@handel-offensiv/types";
import { RELEASE_MODES } from "@handel-offensiv/types";

import { Badge, Button, Checkbox, Dialog, EmptyState, FormField, Input, Select } from "@/components/ui";
import { formatDateTime } from "@/lib/datetime";
import { deleteReleaseAction, saveReleaseAction, type DialogFormState } from "../actions";
import { isoToBerlinLocal } from "../datetime-local";

export interface ReleaseLesson {
  id: string;
  title: string;
  phaseTitle: string;
}
export interface ReleaseModule {
  id: string;
  numberLabel: string;
  title: string;
  lessons: ReleaseLesson[];
}
export interface ReleaseSessionOption {
  id: string;
  label: string;
}

const MODE_LABELS: Record<ReleaseMode, string> = {
  immediate: "Sofort verfügbar",
  at_datetime: "Zu festem Zeitpunkt",
  days_after_session: "Tage nach Präsenztermin",
  days_before_session: "Tage vor Präsenztermin",
  after_lesson: "Nach Abschluss einer Lektion",
  after_module: "Nach Abschluss eines Moduls",
  manual: "Manuell durch Trainer/Admin",
};

const INITIAL: DialogFormState = { error: null, done: false };

/** Kurzbeschreibung der bestehenden Regel fuer die Listenzeile. */
function ruleSummary(
  rule: LessonReleaseRow,
  sessions: ReleaseSessionOption[],
  modules: ReleaseModule[],
): string {
  switch (rule.release_mode) {
    case "immediate":
      return "Sofort verfügbar";
    case "at_datetime":
      return rule.release_at ? `Ab ${formatDateTime(rule.release_at)}` : "Zeitpunkt fehlt";
    case "days_after_session":
    case "days_before_session": {
      const s = sessions.find((x) => x.id === rule.session_id);
      const dir = rule.release_mode === "days_after_session" ? "nach" : "vor";
      const days = rule.offset_days ?? 0;
      return `${days === 1 ? "1 Tag" : `${days} Tage`} ${dir} ${s?.label ?? "Termin (fehlt)"}`;
    }
    case "after_lesson": {
      const lesson = modules
        .flatMap((m) => m.lessons)
        .find((l) => l.id === rule.prerequisite_lesson_id);
      return `Nach Lektion „${lesson?.title ?? "unbekannt"}“`;
    }
    case "after_module": {
      const mod = modules.find((m) => m.id === rule.prerequisite_module_id);
      return `Nach Modul ${mod ? `${mod.numberLabel} – ${mod.title}` : "unbekannt"}`;
    }
    case "manual":
      return rule.released_at
        ? `Manuell – freigeschaltet am ${formatDateTime(rule.released_at)}`
        : "Manuell – noch gesperrt";
  }
}

/**
 * FREISCHALTUNGEN-Tab: je Lektion des Programms die Cohort-Regel
 * (lesson_releases, profile_id NULL) ansehen, setzen oder entfernen.
 */
export function ReleaseEditor({
  cohortId,
  modules,
  sessions,
  releases,
  canManage,
}: {
  cohortId: string;
  modules: ReleaseModule[];
  sessions: ReleaseSessionOption[];
  releases: LessonReleaseRow[];
  canManage: boolean;
}) {
  const [editingLesson, setEditingLesson] = useState<ReleaseLesson | null>(null);

  const ruleForLesson = (lessonId: string): LessonReleaseRow | undefined =>
    releases.find((r) => r.lesson_id === lessonId);

  if (modules.length === 0) {
    return (
      <EmptyState
        title="Keine Inhalte im Programm"
        description="Dieses Programm enthält noch keine Module oder Lektionen – Freischaltungen können erst danach gesetzt werden."
      />
    );
  }

  return (
    <div className="space-y-6">
      {modules.map((mod) => (
        <section key={mod.id} className="rounded border border-line bg-white">
          <header className="flex items-baseline gap-3 border-b border-line px-5 py-3">
            <span aria-hidden="true" className="text-2xl font-extrabold tracking-tight text-green-deep">
              {mod.numberLabel}
            </span>
            <h3 className="text-sm font-bold uppercase tracking-kicker text-ink">{mod.title}</h3>
          </header>
          {mod.lessons.length === 0 ? (
            <p className="px-5 py-4 text-sm text-ink-soft">Keine Lektionen in diesem Modul.</p>
          ) : (
            <ul className="divide-y divide-line/60">
              {mod.lessons.map((lesson) => {
                const rule = ruleForLesson(lesson.id);
                return (
                  <li key={lesson.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink">{lesson.title}</p>
                      <p className="text-xs text-ink-soft">{lesson.phaseTitle}</p>
                    </div>
                    {rule ? (
                      <Badge tone="brand">{ruleSummary(rule, sessions, modules)}</Badge>
                    ) : (
                      <Badge tone="neutral">Keine Regel</Badge>
                    )}
                    {canManage ? (
                      <Button variant="secondary" size="sm" onClick={() => setEditingLesson(lesson)}>
                        {rule ? "Regel bearbeiten" : "Regel setzen"}
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}

      {editingLesson ? (
        <ReleaseDialog
          cohortId={cohortId}
          lesson={editingLesson}
          rule={ruleForLesson(editingLesson.id)}
          modules={modules}
          sessions={sessions}
          onClose={() => setEditingLesson(null)}
        />
      ) : null}
    </div>
  );
}

/** Vorschau-Text "Wird freigeschaltet: …" analog zur Release-Engine. */
function previewText(
  mode: ReleaseMode,
  fields: {
    releaseAt: string;
    offsetDays: string;
    sessionId: string;
    prereqLessonId: string;
    prereqModuleId: string;
    releaseNow: boolean;
  },
  sessions: ReleaseSessionOption[],
  modules: ReleaseModule[],
): string {
  switch (mode) {
    case "immediate":
      return "Wird freigeschaltet: sofort mit Kursstart.";
    case "at_datetime": {
      if (!fields.releaseAt) return "Wird freigeschaltet: am gewählten Zeitpunkt (bitte setzen).";
      const d = new Date(fields.releaseAt);
      return Number.isNaN(d.getTime())
        ? "Wird freigeschaltet: am gewählten Zeitpunkt."
        : `Wird freigeschaltet: am ${formatDateTime(d.toISOString())}.`;
    }
    case "days_after_session":
    case "days_before_session": {
      const s = sessions.find((x) => x.id === fields.sessionId);
      const n = Number(fields.offsetDays || "0");
      const tage = n === 1 ? "1 Tag" : `${n} Tage`;
      const dir = mode === "days_after_session" ? "nach" : "vor";
      return `Wird freigeschaltet: ${tage} ${dir} „${s?.label ?? "gewähltem Termin"}“.`;
    }
    case "after_lesson": {
      const lesson = modules.flatMap((m) => m.lessons).find((l) => l.id === fields.prereqLessonId);
      return `Wird freigeschaltet: nach Abschluss der Lektion „${lesson?.title ?? "…"}“.`;
    }
    case "after_module": {
      const mod = modules.find((m) => m.id === fields.prereqModuleId);
      return `Wird freigeschaltet: nach Abschluss von Modul ${mod ? `${mod.numberLabel} – ${mod.title}` : "…"}.`;
    }
    case "manual":
      return fields.releaseNow
        ? "Wird freigeschaltet: sofort (manuelle Freischaltung beim Speichern)."
        : "Wird freigeschaltet: erst nach manueller Freischaltung durch Trainer oder Admin.";
  }
}

function ReleaseDialog({
  cohortId,
  lesson,
  rule,
  modules,
  sessions,
  onClose,
}: {
  cohortId: string;
  lesson: ReleaseLesson;
  rule?: LessonReleaseRow;
  modules: ReleaseModule[];
  sessions: ReleaseSessionOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveReleaseAction, INITIAL);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteReleaseAction, INITIAL);
  const fe = state.fieldErrors ?? {};

  const [mode, setMode] = useState<ReleaseMode>(rule?.release_mode ?? "immediate");
  const [releaseAt, setReleaseAt] = useState(isoToBerlinLocal(rule?.release_at));
  const [offsetDays, setOffsetDays] = useState(String(rule?.offset_days ?? 1));
  const [sessionId, setSessionId] = useState(rule?.session_id ?? "");
  const [prereqLessonId, setPrereqLessonId] = useState(rule?.prerequisite_lesson_id ?? "");
  const [prereqModuleId, setPrereqModuleId] = useState(rule?.prerequisite_module_id ?? "");
  const [releaseNow, setReleaseNow] = useState(false);

  const done = state.done || deleteState.done;
  useEffect(() => {
    if (done) {
      onClose();
      router.refresh();
    }
  }, [done, onClose, router]);

  const otherLessons = modules
    .flatMap((m) => m.lessons.map((l) => ({ ...l, moduleLabel: m.numberLabel })))
    .filter((l) => l.id !== lesson.id);

  const preview = previewText(
    mode,
    { releaseAt, offsetDays, sessionId, prereqLessonId, prereqModuleId, releaseNow },
    sessions,
    modules,
  );

  return (
    <Dialog open onClose={onClose} title={`Freischaltung: ${lesson.title}`} className="max-w-2xl">
      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="cohortId" value={cohortId} />
        <input type="hidden" name="lessonId" value={lesson.id} />
        {rule ? <input type="hidden" name="releaseId" value={rule.id} /> : null}

        {state.error || deleteState.error ? (
          <p role="alert" className="rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
            {state.error ?? deleteState.error}
          </p>
        ) : null}

        <FormField htmlFor="rel-mode" label="Freischaltungsmodus" required error={fe.mode}>
          <Select
            id="rel-mode"
            name="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as ReleaseMode)}
          >
            {RELEASE_MODES.map((m) => (
              <option key={m} value={m}>
                {MODE_LABELS[m]}
              </option>
            ))}
          </Select>
        </FormField>

        {mode === "at_datetime" ? (
          <FormField htmlFor="rel-at" label="Freischalten am" required error={fe.releaseAt} hint="Zeitzone Europe/Berlin">
            <Input
              id="rel-at"
              name="releaseAt"
              type="datetime-local"
              value={releaseAt}
              onChange={(e) => setReleaseAt(e.target.value)}
              invalid={Boolean(fe.releaseAt)}
            />
          </FormField>
        ) : null}

        {mode === "days_after_session" || mode === "days_before_session" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField htmlFor="rel-session" label="Bezugstermin" required error={fe.sessionId}>
              <Select
                id="rel-session"
                name="sessionId"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                invalid={Boolean(fe.sessionId)}
              >
                <option value="">Bitte wählen</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              htmlFor="rel-offset"
              label={mode === "days_after_session" ? "Tage nach Termin" : "Tage vor Termin"}
              required
              error={fe.offsetDays}
            >
              <Input
                id="rel-offset"
                name="offsetDays"
                type="number"
                min={0}
                max={365}
                value={offsetDays}
                onChange={(e) => setOffsetDays(e.target.value)}
                invalid={Boolean(fe.offsetDays)}
              />
            </FormField>
          </div>
        ) : null}

        {mode === "after_lesson" ? (
          <FormField htmlFor="rel-prev-lesson" label="Vorgänger-Lektion" required error={fe.prerequisiteLessonId}>
            <Select
              id="rel-prev-lesson"
              name="prerequisiteLessonId"
              value={prereqLessonId}
              onChange={(e) => setPrereqLessonId(e.target.value)}
              invalid={Boolean(fe.prerequisiteLessonId)}
            >
              <option value="">Bitte wählen</option>
              {otherLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.moduleLabel} · {l.title}
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}

        {mode === "after_module" ? (
          <FormField htmlFor="rel-prev-module" label="Vorgänger-Modul" required error={fe.prerequisiteModuleId}>
            <Select
              id="rel-prev-module"
              name="prerequisiteModuleId"
              value={prereqModuleId}
              onChange={(e) => setPrereqModuleId(e.target.value)}
              invalid={Boolean(fe.prerequisiteModuleId)}
            >
              <option value="">Bitte wählen</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.numberLabel} – {m.title}
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}

        {mode === "manual" ? (
          <Checkbox
            id="rel-now"
            name="releaseNow"
            label="Jetzt freischalten"
            description="Setzt den Freischaltzeitpunkt beim Speichern auf sofort."
            checked={releaseNow}
            onChange={(e) => setReleaseNow(e.target.checked)}
          />
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField htmlFor="rel-due" label="Fällig bis (optional)" error={fe.dueAt}>
            <Input id="rel-due" name="dueAt" type="datetime-local" defaultValue={isoToBerlinLocal(rule?.due_at)} />
          </FormField>
          <FormField
            htmlFor="rel-expires"
            label="Läuft ab am (optional)"
            error={fe.expiresAt}
            hint="Ab diesem Zeitpunkt ist die Lektion wieder gesperrt."
          >
            <Input
              id="rel-expires"
              name="expiresAt"
              type="datetime-local"
              defaultValue={isoToBerlinLocal(rule?.expires_at)}
            />
          </FormField>
        </div>

        <p className="rounded border border-green/50 bg-green/10 px-4 py-3 text-sm text-ink" aria-live="polite">
          {preview}
        </p>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Wird gespeichert …" : "Regel speichern"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
        </div>
      </form>

      {rule ? (
        <form action={deleteAction} className="mt-3 border-t border-line pt-3">
          <input type="hidden" name="cohortId" value={cohortId} />
          <input type="hidden" name="releaseId" value={rule.id} />
          <Button type="submit" variant="ghost" size="sm" disabled={deletePending}>
            {deletePending ? "Wird entfernt …" : "Regel entfernen"}
          </Button>
        </form>
      ) : null}
    </Dialog>
  );
}
