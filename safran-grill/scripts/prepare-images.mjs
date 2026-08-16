/**
 * Erzeugt aus dem freigegebenen Originalfoto des Google-Unternehmensprofils
 * die zugeschnittenen, optimierten Website-Bilder.
 *
 * Quelle (Original, 3213x5712) wird nicht mit committet – nur die Crops.
 * Aufruf: node scripts/prepare-images.mjs <pfad-zum-original>
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("Usage: node scripts/prepare-images.mjs <original.jpg>");
  process.exit(1);
}

const outDir = path.join(process.cwd(), "public/images/restaurant");
const ogDir = path.join(process.cwd(), "public/images/og");
await mkdir(outDir, { recursive: true });
await mkdir(ogDir, { recursive: true });

// Originalmaße: 3213 x 5712 (Hochformat)
const jobs = [
  {
    // Hero: Hochformat 3:4 – Logo-Wand, Tische, Fensterfront
    out: path.join(outDir, "gastraum-safran-grill-neustadt.jpg"),
    extract: { left: 0, top: 1150, width: 3213, height: 4284 },
    resize: { width: 1600 },
  },
  {
    // Querformat 3:2 – Tische am Fenster zur Hauptstraße
    out: path.join(outDir, "tische-am-fenster-safran-grill.jpg"),
    extract: { left: 0, top: 2450, width: 3213, height: 2142 },
    resize: { width: 2000 },
  },
  {
    // Quadrat – Holzwand mit Safran-Grill-Logo
    out: path.join(outDir, "logo-wand-safran-grill.jpg"),
    extract: { left: 0, top: 700, width: 3213, height: 3213 },
    resize: { width: 1200 },
  },
  {
    // Open-Graph-Bild 1200x630
    out: path.join(ogDir, "safran-grill-neustadt.jpg"),
    extract: { left: 0, top: 2550, width: 3213, height: 1687 },
    resize: { width: 1200, height: 630 },
  },
];

for (const job of jobs) {
  const img = sharp(src).rotate().extract(job.extract).resize(job.resize).jpeg({
    quality: 82,
    mozjpeg: true,
  });
  const info = await img.toFile(job.out);
  console.log(path.basename(job.out), `${info.width}x${info.height}`, `${Math.round(info.size / 1024)}kB`);
}
