/**
 * @handel-offensiv/ui – gemeinsame Bausteine fuer Campus, Admin und Website.
 *
 * Regeln:
 *  - Palette v2 (Navy / Off-White / Gold): Klassen aus dem Tailwind-Preset
 *    in @handel-offensiv/config. Gold NUR fuer Modulnummern, aktive Navigation,
 *    wichtige CTA (Button variant="accent"), Fortschritt, Taktiklinien,
 *    ausgewaehlte Hervorhebungen.
 *  - Alle Komponenten sind Server-Component-tauglich (keine Hooks), deutsch,
 *    barrierearm (Labels, Rollen, Touch-Groesse 44px).
 *  - Apps muessen `packages/ui/src/**` in ihre Tailwind-`content`-Liste aufnehmen.
 */
export { cn } from "./cn";
export { Badge, type BadgeTone } from "./badge";
export { Banner, type BannerKind } from "./banner";
export { Button, type ButtonProps, type ButtonVariant } from "./button";
export { Card } from "./card";
export { Checkbox } from "./checkbox";
export { EmptyState } from "./empty-state";
export { ErrorState } from "./error-state";
export { FormField } from "./form-field";
export { Input } from "./input";
export { Kicker } from "./kicker";
export { LoadingState } from "./loading-state";
export { ModuleNumber } from "./module-number";
export { PageHeader } from "./page-header";
export { ProgressBar } from "./progress-bar";
export { Textarea } from "./textarea";
