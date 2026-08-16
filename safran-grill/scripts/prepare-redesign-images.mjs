/**
 * Zusätzliche Crops für das visuelle Redesign.
 * Aufruf: node scripts/prepare-redesign-images.mjs <interior-original> <buffet-crop-dir>
 */
import sharp from "sharp";
import path from "node:path";

const [interior, buffetDir] = process.argv.slice(2);
if (!interior || !buffetDir) {
  console.error("Usage: node scripts/prepare-redesign-images.mjs <interior.jpg> <buffet-dir>");
  process.exit(1);
}

const out = (f) => path.join(process.cwd(), "public/images/restaurant", f);

// Breites Panorama des Gastraums (aus dem 3213x5712-Original)
let info = await sharp(interior)
  .rotate()
  .extract({ left: 0, top: 2350, width: 3213, height: 1420 })
  .resize({ width: 2200 })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(out("gastraum-panorama-safran-grill.jpg"));
console.log("gastraum-panorama", `${info.width}x${info.height}`, `${Math.round(info.size / 1024)}kB`);

// Quadratisches Grillfleisch-Detail aus dem Buffet-Still (rechte Bildhälfte)
info = await sharp(path.join(buffetDir, "buffet-1870.png"))
  .extract({ left: 400, top: 0, width: 657, height: 657 })
  .resize({ width: 900 })
  .sharpen({ sigma: 0.8 })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(out("grillfleisch-detail-safran-grill.jpg"));
console.log("grillfleisch-detail", `${info.width}x${info.height}`, `${Math.round(info.size / 1024)}kB`);
