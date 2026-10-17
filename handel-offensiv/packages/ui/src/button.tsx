import type { ButtonHTMLAttributes } from "react";

import { cn } from "./cn";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: Size;
}

const VARIANTS: Record<ButtonVariant, string> = {
  // Navy = Standard-Aktion (Palette v2)
  primary: "bg-navy text-white hover:bg-navy-soft active:bg-navy-deep",
  // Gold = wichtige CTA – sparsam einsetzen (eine je Ansicht)
  accent: "bg-gold-bright text-navy hover:bg-gold active:bg-gold",
  secondary: "border border-ink bg-white text-ink hover:bg-paper",
  ghost: "text-ink-soft hover:bg-line/50 hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const SIZES: Record<Size, string> = {
  // min-h-touch = 44px – Mindestgroesse fuer Touch-Targets
  md: "min-h-touch px-5 text-sm",
  sm: "min-h-[36px] px-3 text-sm",
  lg: "min-h-[52px] px-7 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded font-sans font-bold uppercase tracking-kicker",
        "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  );
}
