/**
 * Gestapelte typografische Wortmarke:
 *
 *   SAFRAN            (Fraunces, schwer, mit WONK-Charakter)
 *   GRILL · NEUSTADT  (Sans, gesperrt)
 *
 * Funktioniert im Header, im dunklen Footer (onDark) und skaliert
 * über die size-Prop.
 */
export function Wordmark({
  onDark = false,
  size = "header",
}: {
  onDark?: boolean;
  size?: "header" | "footer";
}) {
  const main = onDark ? "text-paper" : "text-ink";
  const sub = onDark ? "text-paper/60" : "text-ink-faint";
  const isFooter = size === "footer";
  return (
    <span className="inline-flex flex-col">
      <span
        className={`font-display display-black font-bold uppercase leading-none ${main} ${
          isFooter ? "text-4xl" : "text-[1.45rem]"
        }`}
      >
        Safran
      </span>
      <span
        className={`font-sans font-semibold uppercase leading-none ${sub} ${
          isFooter
            ? "mt-2 text-[0.78rem] tracking-[0.3em]"
            : "mt-1 text-[0.55rem] tracking-[0.28em]"
        }`}
      >
        Grill <span aria-hidden className="text-saffron">·</span> Neustadt
      </span>
    </span>
  );
}
