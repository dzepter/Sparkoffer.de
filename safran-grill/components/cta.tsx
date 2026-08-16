import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

/**
 * Schaltflächen und Textlinks des Design-Systems.
 * Kräftiger als vorher: 48px Höhe, 6px Radius, klare Typografie.
 * Externe Links kündigen das neue Tab für Screenreader an.
 */

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-sm px-7 text-[1rem] font-semibold transition-colors duration-fast";

const styles = {
  /* auf Creme */
  primary: `${base} bg-saffron-deep text-paper hover:bg-saffron-deeper`,
  dark: `${base} bg-ink text-paper hover:bg-coal-soft`,
  outline: `${base} border border-ink/35 text-ink hover:border-ink hover:bg-ink/5`,
  /* auf dunklen Flächen */
  primaryOnDark: `${base} bg-saffron-bright text-coal hover:bg-saffron`,
  outlineOnDark: `${base} border border-paper/40 text-paper hover:border-paper hover:bg-paper/10`,
} as const;

type Variant = keyof typeof styles;

/** Screenreader-Hinweis für Links, die ein neues Tab öffnen */
export function NewTabHint() {
  return <span className="sr-only"> (öffnet in neuem Tab)</span>;
}

interface CtaProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  children: ReactNode;
}

/** Interner oder externer CTA-Link im Button-Stil */
export function Cta({ href, variant = "primary", children, ...rest }: CtaProps) {
  const className = styles[variant];
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
      {external && <NewTabHint />}
    </a>
  );
}

/** Kleiner Textlink mit Pfeil, z. B. "Online bestellen" */
export function ArrowLink({
  href,
  children,
  external = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  const cls = `group inline-flex items-center gap-1.5 font-semibold text-saffron-deep transition-colors duration-fast hover:text-ink ${className}`;
  const arrow = (
    <span aria-hidden className="transition-transform duration-fast group-hover:translate-x-0.5">
      {external ? "↗" : "→"}
    </span>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
        <NewTabHint /> {arrow}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children} {arrow}
    </Link>
  );
}

/** Kleines Eyebrow-Label über Headlines */
export function Eyebrow({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return (
    <p
      className={`mb-5 flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-eyebrow ${
        onDark ? "text-saffron-bright" : "text-saffron-deep"
      }`}
    >
      <span aria-hidden className={`h-px w-9 ${onDark ? "bg-saffron-bright" : "bg-saffron"}`} />
      {children}
    </p>
  );
}

/** Feines wiederkehrendes Markenelement: — SAFRAN GRILL */
export function BrandRule({ onDark = false }: { onDark?: boolean }) {
  return (
    <p
      aria-hidden
      className={`flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.3em] ${
        onDark ? "text-paper/40" : "text-ink-faint/80"
      }`}
    >
      <span className={`h-px w-12 ${onDark ? "bg-saffron-bright/60" : "bg-saffron/70"}`} />
      Safran Grill
    </p>
  );
}
