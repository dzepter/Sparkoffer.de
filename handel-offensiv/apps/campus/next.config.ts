import type { NextConfig } from "next";

/**
 * Sicherheits-Header fuer den Campus (noindex: der Campus ist nie oeffentlich
 * indexierbar). Die Content-Security-Policy wird in src/middleware.ts mit
 * Nonce gesetzt (Next.js-Empfehlung), damit keine 'unsafe-inline'-Skripte
 * noetig sind.
 */
const securityHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

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
    "@handel-offensiv/ui",
  ],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
