"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import type { MemberRole, MemberStatus } from "@handel-offensiv/types";

import { Button, Dialog, FormField, Select } from "@/components/ui";
import {
  changeCohortAction,
  changeRoleAction,
  setMembershipStatusAction,
  type RowActionState,
} from "./actions";

export interface CohortOption {
  id: string;
  name: string;
}

export interface MemberRowInfo {
  membershipId: string;
  profileId: string;
  organizationId: string;
  name: string;
  role: MemberRole;
  status: MemberStatus;
  /** Erste aktuelle Gruppe innerhalb der Organisation ("" = keine) */
  currentCohortId: string;
}

const ROLE_LABELS: Record<MemberRole, string> = {
  org_admin: "Org-Admin",
  trainer: "Trainer",
  participant: "Teilnehmer",
};

const INITIAL: RowActionState = { error: null, done: false };

/**
 * Zeilenaktionen (§23): Gruppe ändern, Rolle ändern (nur Super Admin),
 * deaktivieren/reaktivieren. Bewusst KEIN Löschen.
 */
export function RowActions({
  row,
  cohorts,
  canManage,
  isSuperAdmin,
}: {
  row: MemberRowInfo;
  cohorts: CohortOption[];
  canManage: boolean;
  isSuperAdmin: boolean;
}) {
  const [dialog, setDialog] = useState<"gruppe" | "rolle" | null>(null);

  if (!canManage && !isSuperAdmin) return <span className="text-xs text-ink-soft">–</span>;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {canManage ? (
        <>
          <Button variant="ghost" size="sm" onClick={() => setDialog("gruppe")}>
            Gruppe
          </Button>
          <form action={setMembershipStatusAction}>
            <input type="hidden" name="membershipId" value={row.membershipId} />
            <input type="hidden" name="organizationId" value={row.organizationId} />
            <input
              type="hidden"
              name="status"
              value={row.status === "active" ? "inactive" : "active"}
            />
            <Button type="submit" variant="ghost" size="sm">
              {row.status === "active" ? "Deaktivieren" : "Reaktivieren"}
            </Button>
          </form>
        </>
      ) : null}
      {isSuperAdmin ? (
        <Button variant="ghost" size="sm" onClick={() => setDialog("rolle")}>
          Rolle
        </Button>
      ) : null}

      {dialog === "gruppe" ? (
        <CohortDialog row={row} cohorts={cohorts} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === "rolle" ? <RoleDialog row={row} onClose={() => setDialog(null)} /> : null}
    </div>
  );
}

function CohortDialog({
  row,
  cohorts,
  onClose,
}: {
  row: MemberRowInfo;
  cohorts: CohortOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(changeCohortAction, INITIAL);

  useEffect(() => {
    if (state.done) {
      onClose();
      router.refresh();
    }
  }, [state.done, onClose, router]);

  return (
    <Dialog open onClose={onClose} title={`Gruppe ändern: ${row.name}`}>
      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="profileId" value={row.profileId} />
        <input type="hidden" name="organizationId" value={row.organizationId} />

        {state.error ? (
          <p role="alert" className="rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
            {state.error}
          </p>
        ) : null}

        <FormField
          htmlFor={`cohort-${row.membershipId}`}
          label="Neue Gruppe"
          hint="„Keine Gruppe“ entfernt die Person aus allen Gruppen dieser Organisation."
        >
          <Select id={`cohort-${row.membershipId}`} name="cohortId" defaultValue={row.currentCohortId}>
            <option value="">Keine Gruppe</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Wird gespeichert …" : "Übernehmen"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function RoleDialog({ row, onClose }: { row: MemberRowInfo; onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(changeRoleAction, INITIAL);

  useEffect(() => {
    if (state.done) {
      onClose();
      router.refresh();
    }
  }, [state.done, onClose, router]);

  return (
    <Dialog open onClose={onClose} title={`Rolle ändern: ${row.name}`}>
      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="membershipId" value={row.membershipId} />

        {state.error ? (
          <p role="alert" className="rounded border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
            {state.error}
          </p>
        ) : null}

        <FormField
          htmlFor={`role-${row.membershipId}`}
          label="Neue Rolle"
          hint="Rollenwechsel sind dem Super Admin vorbehalten und wirken sofort."
        >
          <Select id={`role-${row.membershipId}`} name="role" defaultValue={row.role}>
            {(Object.keys(ROLE_LABELS) as MemberRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Wird gespeichert …" : "Übernehmen"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
