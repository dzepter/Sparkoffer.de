import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Catch-all der Website-Shell: Alles, was weder eine Datei in public/ noch
 * ein Zonen-Rewrite (next.config.ts) ist, liefert die statische 404-Seite
 * der Website (public/404.html) mit Status 404 – ohne JavaScript, damit die
 * strenge Website-CSP (script-src 'self', keine Inline-Skripte) greift.
 * Zonenpfade (/akademie, /admin, /login) haben ihre eigenen 404-Seiten.
 */
export const dynamic = "force-dynamic";

const NOT_FOUND_FILE = path.join(process.cwd(), "public", "404.html");

export async function GET(): Promise<Response> {
  let html: string;
  try {
    html = await readFile(NOT_FOUND_FILE, "utf8");
  } catch {
    html = "<!DOCTYPE html><html lang=\"de\"><head><meta charset=\"utf-8\"><title>Seite nicht gefunden</title></head><body><h1>Seite nicht gefunden</h1><p><a href=\"/\">Zur Startseite</a></p></body></html>";
  }
  return new Response(html, {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
