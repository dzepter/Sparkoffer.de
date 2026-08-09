import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
