/**
 * Typografische Wortmarke "Safran Grill" mit dezentem Safran-Punkt.
 * Funktioniert im Header, im Footer (invertiert) und skaliert sauber.
 */
export function Wordmark({ onDark = false }: { onDark?: boolean }) {
  return (
    <span
      className={`font-display text-[1.35rem] font-semibold leading-none tracking-tight ${
        onDark ? "text-cream" : "text-ink"
      }`}
    >
      Safran Grill
      <span aria-hidden className="text-saffron">
        .
      </span>
    </span>
  );
}
