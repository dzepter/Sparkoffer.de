/**
 * Rezeptive Bloecke (Server Components): Text, Video, Audio, PDF, Download,
 * Bild, externer Link, Ankuendigung. Storage-Inhalte werden serverseitig mit
 * kurzlebigen signierten URLs (<= 15 min) ueber die Nutzersitzung aufgeloest.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { parseVideoRef } from "@handel-offensiv/domain";
import { Banner } from "@handel-offensiv/ui";
import type { BlockConfigMap } from "@handel-offensiv/validation";

import { resolveVideoPlayback } from "@/features/lernen/data";
import { formatDuration } from "@/features/lernen/format";
import { renderTextBlockHtml } from "@/features/lernen/sanitize";
import { createSignedUrl, LEARNING_ASSETS_BUCKET } from "@/features/lernen/storage";

import { BlockFrame } from "./block-frame";

interface Ctx {
  id: string;
  required: boolean;
  supabase: SupabaseClient;
}

const UNAVAILABLE = "Die Datei ist gerade nicht verfügbar. Bitte versuchen Sie es später erneut.";

/* ------------------------------- Text ---------------------------------- */

export function TextBlock({ id, required, config }: { id: string; required: boolean; config: BlockConfigMap["text"] }) {
  // renderTextBlockHtml ist die EINZIGE Quelle fuer dangerouslySetInnerHTML:
  // Whitelist-Sanitizer (html) bzw. escaptes Markdown-Subset.
  const html = renderTextBlockHtml(config);
  return (
    <BlockFrame id={id} label="Textabschnitt" required={required} plain>
      <div className="prose-campus" dangerouslySetInnerHTML={{ __html: html }} />
    </BlockFrame>
  );
}

/* ------------------------------- Video --------------------------------- */

export async function VideoBlock({ id, required, supabase, config }: Ctx & { config: BlockConfigMap["video"] }) {
  const ref = parseVideoRef(config);
  const playback = ref !== null ? await resolveVideoPlayback(supabase, ref) : null;
  const [poster, subtitles] = await Promise.all([
    config.thumbnailPath !== undefined ? createSignedUrl(supabase, LEARNING_ASSETS_BUCKET, config.thumbnailPath) : Promise.resolve(null),
    config.subtitlesPath !== undefined ? createSignedUrl(supabase, LEARNING_ASSETS_BUCKET, config.subtitlesPath) : Promise.resolve(null),
  ]);

  return (
    <BlockFrame id={id} label="Video" required={required}>
      <h3 className="text-base font-bold text-ink">{config.title}</h3>
      {config.description ? <p className="mt-1 text-sm text-ink-soft">{config.description}</p> : null}
      {config.durationSeconds !== undefined ? (
        <p className="mt-1 text-xs text-ink-soft">Dauer: {formatDuration(config.durationSeconds)}</p>
      ) : null}
      <div className="mt-3 overflow-hidden rounded bg-navy">
        {playback === null ? (
          <p className="p-4 text-sm text-paper/80">{UNAVAILABLE}</p>
        ) : playback.kind === "embed" ? (
          <iframe
            src={playback.url}
            title={config.title}
            className="aspect-video w-full"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            allow="fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <video controls preload="metadata" playsInline className="aspect-video w-full" poster={poster ?? undefined} src={playback.url}>
            {subtitles !== null ? <track kind="subtitles" srcLang="de" label="Deutsch" src={subtitles} default /> : null}
            Ihr Browser kann dieses Video nicht abspielen.
          </video>
        )}
      </div>
      {playback?.kind === "hls" ? (
        <p className="mt-2 text-xs text-ink-soft">Hinweis: Dieses Streaming-Format wird nicht von allen Browsern unterstützt.</p>
      ) : null}
    </BlockFrame>
  );
}

/* ------------------------------- Audio --------------------------------- */

export async function AudioBlock({ id, required, supabase, config }: Ctx & { config: BlockConfigMap["audio"] }) {
  const url = await createSignedUrl(supabase, LEARNING_ASSETS_BUCKET, config.storagePath);
  return (
    <BlockFrame id={id} label="Audio" required={required}>
      <h3 className="text-base font-bold text-ink">{config.title}</h3>
      {config.durationSeconds !== undefined ? (
        <p className="mt-1 text-xs text-ink-soft">Dauer: {formatDuration(config.durationSeconds)}</p>
      ) : null}
      {url === null ? (
        <p className="mt-3 text-sm text-ink-soft">{UNAVAILABLE}</p>
      ) : (
        <audio controls preload="metadata" className="mt-3 w-full" src={url}>
          Ihr Browser kann diese Audiodatei nicht abspielen.
        </audio>
      )}
    </BlockFrame>
  );
}

/* --------------------------- PDF / Download ---------------------------- */

function fileNameFromPath(path: string, fallback: string): string {
  const last = path.split("/").pop();
  return last && last.length > 0 ? last : fallback;
}

export async function FileLinkBlock({
  id,
  required,
  supabase,
  kind,
  config,
}: Ctx & { kind: "pdf" | "download"; config: BlockConfigMap["pdf"] | BlockConfigMap["download"] }) {
  const downloadName = fileNameFromPath(config.storagePath, kind === "pdf" ? "dokument.pdf" : "datei");
  const url = await createSignedUrl(supabase, LEARNING_ASSETS_BUCKET, config.storagePath, { download: downloadName });
  const description = "description" in config ? config.description : undefined;

  return (
    <BlockFrame id={id} label={kind === "pdf" ? "PDF" : "Download"} required={required}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-ink">{config.title}</h3>
          {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
        </div>
        {url === null ? (
          <p className="text-sm text-ink-soft">{UNAVAILABLE}</p>
        ) : (
          <a
            href={url}
            download={downloadName}
            className="inline-flex min-h-touch items-center justify-center rounded bg-navy px-5 text-sm font-bold uppercase tracking-kicker text-white hover:bg-navy-soft"
          >
            {kind === "pdf" ? "PDF herunterladen" : "Herunterladen"}
          </a>
        )}
      </div>
    </BlockFrame>
  );
}

/* -------------------------------- Bild --------------------------------- */

export async function ImageBlock({ id, required, supabase, config }: Ctx & { config: BlockConfigMap["image"] }) {
  const url = await createSignedUrl(supabase, LEARNING_ASSETS_BUCKET, config.storagePath);
  return (
    <BlockFrame id={id} label="Bild" required={required}>
      {url === null ? (
        <p className="text-sm text-ink-soft">{UNAVAILABLE}</p>
      ) : (
        <figure>
          {/* Signierte, kurzlebige URL – kein next/image (keine Optimierung privater Inhalte) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={config.alt} className="w-full rounded" loading="lazy" />
          {config.caption ? <figcaption className="mt-2 text-sm text-ink-soft">{config.caption}</figcaption> : null}
        </figure>
      )}
    </BlockFrame>
  );
}

/* --------------------------- Externer Link ----------------------------- */

export function ExternalLinkBlock({ id, required, config }: { id: string; required: boolean; config: BlockConfigMap["external_link"] }) {
  return (
    <BlockFrame id={id} label="Externer Link" required={required}>
      <a
        href={config.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-touch items-center font-bold text-navy underline underline-offset-2"
      >
        {config.label}
        <span aria-hidden="true" className="ml-1">
          ↗
        </span>
        <span className="sr-only"> (öffnet in neuem Fenster)</span>
      </a>
      <p className="mt-2 text-sm text-ink-soft">{config.note}</p>
    </BlockFrame>
  );
}

/* ---------------------------- Ankuendigung ----------------------------- */

export function AnnouncementBlock({ id, config }: { id: string; config: BlockConfigMap["announcement"] }) {
  return (
    <div id={`block-${id}`} className="scroll-mt-24">
      <Banner
        kind="info"
        className="border-l-[3px] border-l-navy"
        message={
          <>
            <span className="block font-bold text-ink">{config.title}</span>
            <span className="mt-1 block whitespace-pre-line text-ink">{config.body}</span>
          </>
        }
      />
    </div>
  );
}
