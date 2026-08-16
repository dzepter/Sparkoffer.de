/**
 * Verarbeitet die vom Eigentümer freigegebenen Buffet-Fotos
 * (Video-Stills) zu optimierten Website-Bildern.
 * Aufruf: node scripts/prepare-buffet-images.mjs <ordner-mit-crops>
 */
import sharp from "sharp";
import path from "node:path";

const srcDir = process.argv[2];
if (!srcDir) {
  console.error("Usage: node scripts/prepare-buffet-images.mjs <dir>");
  process.exit(1);
}

const outDir = path.join(process.cwd(), "public/images/restaurant");

const jobs = [
  ["buffet-1870.png", "buffet-reis-und-grillfleisch-safran-grill.jpg"],
  ["buffet-1871.png", "reisgericht-buffet-safran-grill-neustadt.jpg"],
  ["buffet-1872.png", "buffet-gerichte-safran-grill.jpg"],
  ["buffet-1873.png", "buffetstrecke-safran-grill-neustadt.jpg"],
];

for (const [src, out] of jobs) {
  const info = await sharp(path.join(srcDir, src))
    .resize({ width: 1170 })
    .sharpen({ sigma: 0.8 })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(path.join(outDir, out));
  console.log(out, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)}kB`);
}
