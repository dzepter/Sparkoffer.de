import type { ReactNode } from "react";

import { PublicFrame } from "./public-frame";

/**
 * Rahmen fuer Login, Einladung, Passwort vergessen/neu: oeffentlich
 * erreichbar (Middleware), ohne Campus-Navigation.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <PublicFrame>{children}</PublicFrame>;
}
