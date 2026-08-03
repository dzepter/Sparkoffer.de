import Link from "next/link";
import type { ReactNode } from "react";

/** Gemeinsame Layout- und UI-Primitives. */

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline-dark" | "outline-light";
  className?: string;
};

/** Einheitliche CTA-Buttons – große Touch-Ziele, klare Fokuszustände. */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex min-h-12 items-center justify-center gap-2 px-6 py-3 text-center font-display font-semibold uppercase tracking-wider text-[0.9375rem] hyphens-auto [overflow-wrap:anywhere] transition-colors duration-200";
  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: "bg-rot text-white hover:bg-rot-dark",
    secondary:
      "bg-ink text-white hover:bg-ink-3",
    "outline-dark":
      "border-2 border-ink text-ink hover:bg-ink hover:text-white",
    "outline-light":
      "border-2 border-white/70 text-white hover:bg-white hover:text-ink",
  };
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={`eyebrow text-rot ${className}`}>{children}</p>;
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  dark = false,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={`max-w-3xl ${className}`}>
      {eyebrow ? (
        <Eyebrow className={dark ? "text-[#ff8a80]" : undefined}>
          {eyebrow}
        </Eyebrow>
      ) : null}
      <h2
        className={`display mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {intro ? (
        <p
          className={`mt-5 text-lg leading-relaxed ${
            dark ? "text-mute-dark" : "text-mute"
          }`}
        >
          {intro}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Dezente Taktiktafel-Linien als Hintergrund-Dekoration.
 * Rein dekorativ (aria-hidden), Inhalte bleiben ohne sie verständlich.
 */
export function TacticLines({
  className = "",
  variant = "corner",
}: {
  className?: string;
  variant?: "corner" | "run" | "halfway";
}) {
  if (variant === "halfway") {
    return (
      <svg
        aria-hidden="true"
        className={`pointer-events-none absolute ${className}`}
        viewBox="0 0 400 400"
        fill="none"
      >
        <circle cx="200" cy="200" r="160" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="4" fill="currentColor" />
        <line x1="0" y1="200" x2="400" y2="200" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (variant === "run") {
    return (
      <svg
        aria-hidden="true"
        className={`pointer-events-none absolute ${className}`}
        viewBox="0 0 600 200"
        fill="none"
      >
        <path
          d="M10 180 C 150 160, 250 60, 420 50 L 560 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="8 10"
        />
        <path
          d="M545 42 L 566 22 L 556 50"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="12" cy="180" r="6" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      viewBox="0 0 300 300"
      fill="none"
    >
      <path d="M300 2 H120 A118 118 0 0 0 2 120 V300" stroke="currentColor" strokeWidth="1.5" />
      <path d="M300 60 H160 A100 100 0 0 0 60 160 V300" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

export function QuoteBlock({
  quote,
  attribution,
  dark = false,
}: {
  quote: string;
  attribution?: string;
  dark?: boolean;
}) {
  return (
    <figure className="relative">
      <span
        aria-hidden="true"
        className="tactic-number absolute -top-6 left-0 text-7xl text-rot/20 select-none"
      >
        „
      </span>
      <blockquote
        className={`display text-2xl sm:text-3xl ${dark ? "text-white" : "text-ink"}`}
      >
        {quote}
      </blockquote>
      {attribution ? (
        <figcaption
          className={`mt-4 text-sm ${dark ? "text-mute-dark" : "text-mute"}`}
        >
          {attribution}
        </figcaption>
      ) : null}
    </figure>
  );
}
