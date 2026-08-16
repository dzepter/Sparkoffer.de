import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

/**
 * Schaltflächen und Textlinks des kleinen Design-Systems.
 * Bewusst zurückhaltend: kaum Radius, feine Übergänge, keine Schatten.
 */

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 text-[0.95rem] font-medium transition-colors duration-fast";

const styles = {
  primary: `${base} bg-saffron text-cream hover:bg-saffron-deep`,
  outline: `${base} border border-ink/30 text-ink hover:border-ink hover:bg-ink/5`,
  /* Varianten für die dunkle Espresso-Sektion */
  primaryOnDark: `${base} bg-cream text-espresso hover:bg-cream-deep`,
  outlineOnDark: `${base} border border-cream/40 text-cream hover:border-cream hover:bg-cream/10`,
} as const;

type Variant = keyof typeof styles;

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
  return (
    <a
      href={href}
      className={className}
      {...(href.startsWith("http")
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      {...rest}
    >
      {children}
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
  const cls = `group inline-flex items-center gap-1.5 font-medium text-saffron-deep transition-colors duration-fast hover:text-ink ${className}`;
  const arrow = (
    <span aria-hidden className="transition-transform duration-fast group-hover:translate-x-0.5">
      {external ? "↗" : "→"}
    </span>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children} {arrow}
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
      className={`mb-4 flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-eyebrow ${
        onDark ? "text-cream/70" : "text-saffron-deep"
      }`}
    >
      <span aria-hidden className={`h-px w-8 ${onDark ? "bg-cream/40" : "bg-saffron"}`} />
      {children}
    </p>
  );
}
