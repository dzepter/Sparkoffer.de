"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Copyright-Jahr, das sich nach dem Jahreswechsel auch ohne neues
 * Deployment aktualisiert. Server-Fallback ist das Build-Jahr.
 */
export function YearNow({ fallback }: { fallback: number }) {
  const year = useSyncExternalStore(
    emptySubscribe,
    () => new Date().getFullYear(),
    () => fallback
  );
  return <>{year}</>;
}
