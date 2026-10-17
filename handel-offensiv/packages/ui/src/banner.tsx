import type { ReactNode } from "react";

import { cn } from "./cn";

export type BannerKind = "info" | "success" | "warning" | "error";

const KINDS: Record<BannerKind, string> = {
  info: "border-line bg-white text-ink",
  success: "border-success/40 bg-success/5 text-ink",
  warning: "border-warning/40 bg-warning/5 text-ink",
  error: "border-danger/40 bg-danger/5 text-danger",
};

export interface BannerProps {
  kind?: BannerKind;
  /** Deutsche, verstaendliche Meldung – nie technische Codes */
  message: ReactNode;
  /** Optionale Aktion (z. B. "Erneut versuchen") */
  action?: ReactNode;
  className?: string;
}

/** Hinweisbox; Fehler werden als role="alert" angekuendigt, Rest als status. */
export function Banner({ kind = "info", message, action, className }: BannerProps) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded border px-3 py-2.5 text-sm",
        KINDS[kind],
        className,
      )}
    >
      <div className="min-w-0 flex-1">{message}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
