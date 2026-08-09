import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  // Markengruen mit dunklem Text – wie die primaeren CTAs der Website
  primary: "bg-green text-dark hover:bg-green-bright active:bg-green-bright",
  secondary: "border border-ink bg-white text-ink hover:bg-paper",
  ghost: "text-ink-soft hover:bg-line/50 hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const SIZES: Record<Size, string> = {
  // min-h-touch = 44px – Mindestgroesse fuer Touch-Targets
  md: "min-h-touch px-5 text-sm",
  sm: "min-h-[36px] px-3 text-sm",
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
