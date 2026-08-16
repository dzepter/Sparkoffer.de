/**
 * Erzeugt PNG-/ICO-Favicons aus app/icon.svg.
 * Aufruf: node scripts/make-icons.mjs
 */
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const svg = await readFile("app/icon.svg");

// Apple Touch Icon (180x180, ohne Transparenz)
await sharp(svg, { density: 300 })
  .resize(180, 180)
  .flatten({ background: "#241b11" })
  .png()
  .toFile("app/apple-icon.png");
console.log("app/apple-icon.png");

// favicon.ico: ICO-Container mit eingebettetem 32x32-PNG
const png32 = await sharp(svg, { density: 300 }).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // count
const entry = Buffer.alloc(16);
entry.writeUInt8(32, 0); // width
entry.writeUInt8(32, 1); // height
entry.writeUInt8(0, 2); // palette
entry.writeUInt8(0, 3); // reserved
entry.writeUInt16LE(1, 4); // planes
entry.writeUInt16LE(32, 6); // bpp
entry.writeUInt32LE(png32.length, 8); // size
entry.writeUInt32LE(22, 12); // offset
await writeFile("app/favicon.ico", Buffer.concat([header, entry, png32]));
console.log("app/favicon.ico");
