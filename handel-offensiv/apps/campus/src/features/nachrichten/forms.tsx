"use client";

import { useActionState } from "react";

import { Banner, Button } from "@handel-offensiv/ui";

import { INITIAL_FORM_STATE } from "@/lib/auth/form-state";

import { markAllNotificationsReadAction, markNotificationReadAction } from "./actions";

/** "Alle als gelesen markieren" – nur sichtbar, wenn es Ungelesenes gibt. */
export function MarkAllReadForm() {
  const [state, formAction, pending] = useActionState(markAllNotificationsReadAction, INITIAL_FORM_STATE);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <Button type="submit" variant="ghost" size="sm" disabled={pending} className="min-h-touch">
        {pending ? "Wird markiert …" : "Alle als gelesen markieren"}
      </Button>
      {state.error ? <Banner kind="error" message={state.error} /> : null}
    </form>
  );
}

/** Einzelne Benachrichtigung als gelesen markieren. */
export function MarkReadForm({ notificationId }: { notificationId: string }) {
  const [state, formAction, pending] = useActionState(markNotificationReadAction, INITIAL_FORM_STATE);

  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="notificationId" value={notificationId} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending} className="min-h-touch" aria-label="Diese Nachricht als gelesen markieren">
        {pending ? "…" : "Gelesen"}
      </Button>
      {state.error ? (
        <p role="alert" className="mt-1 text-xs text-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
