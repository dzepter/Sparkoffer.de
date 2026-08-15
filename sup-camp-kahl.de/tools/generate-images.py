#!/usr/bin/env python3
"""Erzeugt die responsiven WebP-Ableitungen für sup-camp-kahl.de.

Quelle sind die Original-Fotos aus der WordPress-Mediathek der Live-Site
(https://sup-camp-kahl.de/wp-content/uploads/...). Das Skript erwartet die
Originale in einem Quellordner und schreibt WebP-Dateien in
assets/img/ nach dem Schema  <name>-w<breite>.webp.

Aufruf:  python3 tools/generate-images.py <quellordner>

Benötigt: Pillow  (pip install pillow)
"""
import sys
import pathlib
from PIL import Image, ImageOps

# Breiten je Rolle: große Full-Bleed-Flächen bekommen mehr Stufen.
LARGE = [800, 1200, 1800, 2400]
MEDIUM = [480, 900, 1400]

# Bilder, die als Hero / Full-Bleed laufen.
LARGE_IMAGES = {
    "sup-kurs-kahl-am-see-2026-06-20-sup-kurs-auf-dem-see-01",
    "sup-kurs-gruppe-traegt-board-kahler-see",
    "stand-up-paddling-kahl-am-see-2026-06-20-entspannte-sup-tour",
    "sup-kurs-briefing-gruppe-strand-kahler-see",
    "sup-boards-sandstrand-kahler-see-verleih",
}

# Untere Bildkante mit eingebranntem Geräte-Wasserzeichen abschneiden (Anteil).
BOTTOM_CROP = {"sup-board-verleih-lager-kahler-see": 0.07}

QUALITY = 76


def main(src_dir: str) -> None:
    src = pathlib.Path(src_dir)
    out = pathlib.Path(__file__).resolve().parent.parent / "assets" / "img"
    out.mkdir(parents=True, exist_ok=True)
    for f in sorted(src.iterdir()):
        if f.suffix.lower() not in (".jpg", ".jpeg", ".webp", ".png"):
            continue
        stem = f.stem.replace("-scaled", "")
        if stem == "sup-camp-kahler-see-logo":
            continue
        im = Image.open(f)
        im = ImageOps.exif_transpose(im).convert("RGB")
        if stem in BOTTOM_CROP:
            w, h = im.size
            im = im.crop((0, 0, w, int(h * (1 - BOTTOM_CROP[stem]))))
        widths = LARGE if stem in LARGE_IMAGES else MEDIUM
        for width in widths:
            if width >= im.size[0]:
                continue
            ratio = width / im.size[0]
            resized = im.resize((width, round(im.size[1] * ratio)), Image.LANCZOS)
            dest = out / f"{stem}-w{width}.webp"
            resized.save(dest, "WEBP", quality=QUALITY, method=6)
            print(dest.name, resized.size)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "source-media")
