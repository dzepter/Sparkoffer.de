import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-green text-dark hover:bg-green-bright",
  secondary: "border border-ink bg-white text-ink hover:bg-paper",
  ghost: "text-ink-soft hover:bg-line/50 hover:text-ink",
};

/** Link im Button-Look (Server-tauglich, kein Client-JS). */
export function LinkButton({
  href,
  variant = "secondary",
  children,
  className,
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-touch items-center justify-center gap-2 rounded px-5 text-sm font-bold uppercase tracking-kicker transition-colors",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
