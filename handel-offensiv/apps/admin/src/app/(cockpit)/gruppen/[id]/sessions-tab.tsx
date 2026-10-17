"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import type { CohortSessionRow } from "@handel-offensiv/types";

import { Badge, Button, Dialog, EmptyState, FormField, Input, Select, Textarea } from "@/components/ui";
import { formatDateTime, formatTime } from "@/lib/datetime";
import { deleteSessionAction, saveSessionAction, type DialogFormState } from "../actions";
import { isoToBerlinLocal } from "../datetime-local";

export interface ModuleOption {
  id: string;
  label: string;
}
export interface TrainerOption {
  profileId: string;
  name: string;
}

const INITIAL: DialogFormState = { error: null, done: false };

/**
 * TERMINE-Tab (§18): Praesenztermine der Gruppe anlegen/bearbeiten.
 * Felder: Titel, Modul, Beginn/Ende, Ort, Adresse, Raum, Trainer,
 * Hinweise, Anfahrt. Zeitzone fest Europe/Berlin.
 */
export function SessionsTab({
  cohortId,
  sessions,
  modules,
  trainers,
  canManage,
}: {
  cohortId: string;
  sessions: CohortSessionRow[];
  modules: ModuleOption[];
  trainers: TrainerOption[];
  canManage: boolean;
}) {
  const [editing, setEditing] = useState<CohortSessionRow | "neu" | null>(null);

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={() => setEditing("neu")}>Termin anlegen</Button>
        </div>
      ) : null}

      {sessions.length === 0 ? (
        <EmptyState
          title="Noch keine Termine"
          description="Legen Sie die Präsenztermine dieser Gruppe an – sie steuern auch terminbezogene Freischaltungen."
        />
      ) : (
        <ul className="divide-y divide-line/60 rounded border border-line bg-white">
          {sessions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{s.title}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {formatDateTime(s.starts_at)}
                  {s.ends_at ? ` – ${formatTime(s.ends_at)}` : ""}
                  {s.venue ? ` · ${s.venue}` : ""}
                  {s.room ? ` · ${s.room}` : ""}
                </p>
              </div>
              {modules.find((m) => m.id === s.module_id) ? (
                <Badge tone="brand">{modules.find((m) => m.id === s.module_id)?.label}</Badge>
              ) : null}
              {canManage ? (
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditing(s)}>
                    Bearbeiten
                  </Button>
                  <form action={deleteSessionAction}>
                    <input type="hidden" name="cohortId" value={cohortId} />
                    <input type="hidden" name="sessionId" value={s.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Löschen
                    </Button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {editing !== null ? (
        <SessionDialog
          cohortId={cohortId}
          session={editing === "neu" ? undefined : editing}
          modules={modules}
          trainers={trainers}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

function SessionDialog({
  cohortId,
  session,
  modules,
  trainers,
  onClose,
}: {
  cohortId: string;
  session?: CohortSessionRow;
  modules: ModuleOption[];
  trainers: TrainerOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveSessionAction, INITIAL);
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.done) {
      onClose();
      router.refresh();
    }
  }, [state.done, onClose, router]);

  return (
    <Dialog
      open
      onClose={onClose}
      title={session ? "Termin bearbeiten" : "Termin anlegen"}
      className="max-w-2xl"
    >
      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="cohortId" value={cohortId} />
        {session ? <input type="hidden" name="sessionId" value={session.id} /> : null}

        {state.error ? (
          <p role="alert" className="rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
            {state.error}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField htmlFor="sess-title" label="Titel" required error={fe.title} className="sm:col-span-2">
            <Input id="sess-title" name="title" defaultValue={session?.title ?? ""} invalid={Boolean(fe.title)} required />
          </FormField>

          <FormField htmlFor="sess-module" label="Modul" error={fe.moduleId}>
            <Select id="sess-module" name="moduleId" defaultValue={session?.module_id ?? ""}>
              <option value="">Kein Modul</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField htmlFor="sess-trainer" label="Trainer" error={fe.trainerProfileId}>
            <Select id="sess-trainer" name="trainerProfileId" defaultValue={session?.trainer_profile_id ?? ""}>
              <option value="">Noch offen</option>
              {trainers.map((t) => (
                <option key={t.profileId} value={t.profileId}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField htmlFor="sess-start" label="Beginn" required error={fe.startsAt} hint="Zeitzone Europe/Berlin">
            <Input
              id="sess-start"
              name="startsAt"
              type="datetime-local"
              defaultValue={isoToBerlinLocal(session?.starts_at)}
              invalid={Boolean(fe.startsAt)}
              required
            />
          </FormField>

          <FormField htmlFor="sess-end" label="Ende" error={fe.endsAt}>
            <Input
              id="sess-end"
              name="endsAt"
              type="datetime-local"
              defaultValue={isoToBerlinLocal(session?.ends_at)}
              invalid={Boolean(fe.endsAt)}
            />
          </FormField>

          <FormField htmlFor="sess-venue" label="Ort / Location" error={fe.venue}>
            <Input id="sess-venue" name="venue" defaultValue={session?.venue ?? ""} />
          </FormField>

          <FormField htmlFor="sess-room" label="Raum" error={fe.room}>
            <Input id="sess-room" name="room" defaultValue={session?.room ?? ""} />
          </FormField>

          <FormField htmlFor="sess-address" label="Adresse" error={fe.address} className="sm:col-span-2">
            <Input id="sess-address" name="address" defaultValue={session?.address ?? ""} />
          </FormField>

          <FormField htmlFor="sess-notes" label="Hinweise" error={fe.notes} className="sm:col-span-2">
            <Textarea id="sess-notes" name="notes" rows={2} defaultValue={session?.notes ?? ""} />
          </FormField>

          <FormField htmlFor="sess-directions" label="Anfahrt" error={fe.directions} className="sm:col-span-2">
            <Textarea id="sess-directions" name="directions" rows={2} defaultValue={session?.directions ?? ""} />
          </FormField>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Wird gespeichert …" : "Speichern"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
