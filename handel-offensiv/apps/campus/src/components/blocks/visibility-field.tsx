import type { VisibilityLevel } from "@handel-offensiv/types";
import { cn } from "@handel-offensiv/ui";

/**
 * Sichtbarkeitswahl fuer Reflexionen/Abgaben: Standard "Nur für mich".
 * Org-Admins sehen Eintraege nie (RLS) – das sagt der Hinweistext auch.
 */
export function VisibilityField({ name, value, idPrefix }: { name: string; value: VisibilityLevel; idPrefix: string }) {
  const options: { value: VisibilityLevel; label: string; hint: string }[] = [
    { value: "private", label: "Nur für mich", hint: "Niemand sonst kann diesen Eintrag lesen." },
    { value: "trainer", label: "Für meinen Trainer sichtbar", hint: "Ihr Trainer kann lesen und Feedback geben." },
  ];
  return (
    <fieldset>
      <legend className="text-sm font-bold text-ink">Sichtbarkeit</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label
            key={o.value}
            htmlFor={`${idPrefix}-${o.value}`}
            className={cn(
              "flex min-h-touch cursor-pointer items-start gap-3 rounded border border-line bg-white px-3 py-2.5",
              "has-[:checked]:border-navy",
            )}
          >
            <input type="radio" id={`${idPrefix}-${o.value}`} name={name} value={o.value} defaultChecked={value === o.value} className="mt-0.5 h-5 w-5 accent-navy" />
            <span className="text-sm leading-5 text-ink">
              {o.label}
              <span className="block text-xs text-ink-soft">{o.hint}</span>
            </span>
          </label>
        ))}
      </div>
      <p className="mt-1 text-xs text-ink-soft">Unternehmens-Administratoren haben nie Zugriff auf Ihre Einträge.</p>
    </fieldset>
  );
}
