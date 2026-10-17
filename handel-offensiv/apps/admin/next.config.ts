import type { NextConfig } from "next";

/**
 * Pfad-Praefix des Cockpits (Zielstruktur Version 1):
 *   https://www.handel-offensiv.de/admin -> diese App (Zone "admin")
 * Die Website-Shell (apps/web) reicht /admin/* per Rewrite hierher weiter.
 * Links, Redirects und Assets erhalten das Praefix automatisch.
 */
export const BASE_PATH = "/admin";

/**
 * Oeffentliche Hosts, von denen Server Actions (Formulare) angenommen werden.
 * Das Cockpit wird ueber die Website-Shell (Rewrite) ausgeliefert; der Browser
 * sendet als Origin den Host der Website, waehrend diese App unter ihrem
 * Vercel-Host antwortet. Siehe apps/campus/next.config.ts.
 */
const allowedOrigins = (process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "localhost:3100")
  .split(",")
  .map((h) => h.trim())
  .filter((h) => h !== "");

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  /**
   * Workspace-Packages liegen als TypeScript-Quellen vor (main -> src/index.ts)
   * und muessen von Next transpiliert werden.
   */
  transpilePackages: [
    "@handel-offensiv/types",
    "@handel-offensiv/validation",
    "@handel-offensiv/domain",
    "@handel-offensiv/config",
  ],
  poweredByHeader: false,
  experimental: {
    serverActions: { allowedOrigins },
  },
};

export default nextConfig;
