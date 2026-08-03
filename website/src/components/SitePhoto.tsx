import Image from "next/image";
import type { ImageSlot } from "@/content/images";

/**
 * Rendert ein Bild aus dem zentralen Bildregister.
 * Liegt die Datei noch nicht vor, erscheint ein hochwertiger,
 * klar beschrifteter Platzhalter im Stil einer Taktiktafel.
 */
export function SitePhoto({
  image,
  sizes,
  className = "",
  imgClassName = "",
  preload = false,
}: {
  image: ImageSlot;
  sizes: string;
  className?: string;
  imgClassName?: string;
  preload?: boolean;
}) {
  if (!image.available) {
    return (
      <div
        role="img"
        aria-label={`Platzhalter – hier folgt: ${image.neededDescription ?? image.alt}`}
        className={`relative flex items-center justify-center overflow-hidden bg-ink-2 ${className}`}
      >
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.07]"
          viewBox="0 0 100 140"
          preserveAspectRatio="none"
          fill="none"
        >
          <rect x="6" y="6" width="88" height="128" stroke="currentColor" strokeWidth="0.7" />
          <line x1="6" y1="70" x2="94" y2="70" stroke="currentColor" strokeWidth="0.7" />
          <circle cx="50" cy="70" r="14" stroke="currentColor" strokeWidth="0.7" />
          <rect x="30" y="6" width="40" height="16" stroke="currentColor" strokeWidth="0.7" />
          <rect x="30" y="118" width="40" height="16" stroke="currentColor" strokeWidth="0.7" />
        </svg>
        <div className="relative px-6 py-10 text-center">
          <p className="eyebrow text-white/50">Foto folgt</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
            {image.neededDescription ?? image.alt}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        preload={preload || undefined}
        className={`h-full w-full object-cover ${
          image.grayscale ? "grayscale" : ""
        } ${imgClassName}`}
      />
    </div>
  );
}
