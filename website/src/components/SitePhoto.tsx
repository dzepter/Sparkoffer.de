import Image from "next/image";
import type { ImageSlot } from "@/content/images";

/**
 * Rendert ein Bild aus dem zentralen Bildregister.
 * Slots ohne vorliegende Datei werden nicht gerendert (kein sichtbarer
 * Platzhalter im Produktions-Build) – die aufrufende Seite entscheidet,
 * wie das Layout ohne Bild aussieht, oder übergibt einen Fallback-Slot.
 */
export function SitePhoto({
  image,
  fallback,
  sizes,
  className = "",
  imgClassName = "",
  preload = false,
}: {
  image: ImageSlot;
  /** Wird verwendet, solange `image` noch nicht als Datei vorliegt. */
  fallback?: ImageSlot;
  sizes: string;
  className?: string;
  imgClassName?: string;
  preload?: boolean;
}) {
  const resolved = image.available
    ? image
    : fallback?.available
      ? fallback
      : null;

  if (!resolved) return null;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={resolved.src}
        alt={resolved.alt}
        width={resolved.width}
        height={resolved.height}
        sizes={sizes}
        preload={preload || undefined}
        className={`h-full w-full object-cover ${
          resolved.grayscale ? "grayscale" : ""
        } ${imgClassName}`}
      />
    </div>
  );
}
