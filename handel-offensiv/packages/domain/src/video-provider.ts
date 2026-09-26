/**
 * VideoProvider-Abstraktion (Freigabe K-6, 26.09.2026).
 *
 * Lernlogik und Datenbank kennen nur eine VideoRef (im content_blocks.config
 * eines video-Blocks). WO das Video liegt und WIE es abgespielt wird,
 * entscheidet ein Provider zur Laufzeit. Ein Wechsel (Supabase Storage ->
 * Bunny/Mux/Vimeo) aendert weder Lernmodule noch Datenmodell – nur die
 * Provider-Registrierung in der App.
 *
 * Reine Domaenenlogik ohne IO: das Signieren von URLs uebergibt die App als
 * Funktion (z. B. supabase.storage.from(bucket).createSignedUrl).
 */

// --------------------------------------------------------------------------
// Referenzen (persistiert in content_blocks.config)
// --------------------------------------------------------------------------

/** Video in Supabase Storage (privater Bucket, Zugriff nur ueber signierte URL). */
export interface StorageVideoRef {
  provider: 'storage';
  /** Pfad im Bucket, z. B. "programs/handel-offensiv/m01/intro.mp4" */
  storagePath: string;
  /** Bucket-Name; Default siehe DEFAULT_VIDEO_BUCKET */
  bucket?: string;
}

/** Extern gehostetes Video (spaeterer Streaming-Anbieter oder Einbettung). */
export interface ExternalVideoRef {
  provider: 'external';
  /** https-URL (Player-/Embed-URL oder direkte Mediendatei) */
  url: string;
}

export type VideoRef = StorageVideoRef | ExternalVideoRef;

export const DEFAULT_VIDEO_BUCKET = 'learning-assets';

// --------------------------------------------------------------------------
// Wiedergabe
// --------------------------------------------------------------------------

export type PlaybackKind = 'file' | 'hls' | 'embed';

export interface PlaybackSource {
  kind: PlaybackKind;
  url: string;
  /** Ablauf einer signierten URL (falls zutreffend) */
  expiresAt?: Date;
}

export interface VideoProvider {
  /** Kennung fuer Logs/Diagnose, z. B. "supabase-storage" */
  readonly id: string;
  supports(ref: VideoRef): boolean;
  resolvePlayback(ref: VideoRef, now: Date): Promise<PlaybackSource>;
}

// --------------------------------------------------------------------------
// Provider-Implementierungen (IO wird injiziert)
// --------------------------------------------------------------------------

export type SignUrl = (bucket: string, path: string, ttlSeconds: number) => Promise<string>;

export interface SupabaseStorageVideoProviderOptions {
  signUrl: SignUrl;
  /** Gueltigkeit signierter URLs in Sekunden (Default 1 h) */
  ttlSeconds?: number;
}

/** Pilot-/Lernvideos in Supabase Storage (privat, signierte URLs). */
export function createSupabaseStorageVideoProvider(
  options: SupabaseStorageVideoProviderOptions,
): VideoProvider {
  const ttl = options.ttlSeconds ?? 3600;
  return {
    id: 'supabase-storage',
    supports: (ref) => ref.provider === 'storage',
    async resolvePlayback(ref, now) {
      if (ref.provider !== 'storage') throw new Error('Provider unterstuetzt diese Referenz nicht.');
      const url = await options.signUrl(ref.bucket ?? DEFAULT_VIDEO_BUCKET, ref.storagePath, ttl);
      return {
        kind: ref.storagePath.toLowerCase().endsWith('.m3u8') ? 'hls' : 'file',
        url,
        expiresAt: new Date(now.getTime() + ttl * 1000),
      };
    },
  };
}

/** Externe https-Quellen (Streaming-Anbieter, Einbettungen). */
export function createExternalVideoProvider(): VideoProvider {
  return {
    id: 'external',
    supports: (ref) => ref.provider === 'external',
    resolvePlayback(ref) {
      if (ref.provider !== 'external') {
        return Promise.reject(new Error('Provider unterstuetzt diese Referenz nicht.'));
      }
      if (!ref.url.startsWith('https://')) {
        return Promise.reject(new Error('Nur https-Quellen sind erlaubt.'));
      }
      const lower = ref.url.toLowerCase();
      const kind: PlaybackKind = lower.endsWith('.m3u8')
        ? 'hls'
        : /\.(mp4|webm|mov)(\?|$)/.test(lower)
          ? 'file'
          : 'embed';
      return Promise.resolve({ kind, url: ref.url });
    },
  };
}

// --------------------------------------------------------------------------
// Registry
// --------------------------------------------------------------------------

export interface VideoProviderRegistry {
  register(provider: VideoProvider): VideoProviderRegistry;
  /** Liefert den ersten Provider, der die Referenz unterstuetzt (fail-closed). */
  providerFor(ref: VideoRef): VideoProvider;
  resolvePlayback(ref: VideoRef, now?: Date): Promise<PlaybackSource>;
}

export function createVideoProviderRegistry(): VideoProviderRegistry {
  const providers: VideoProvider[] = [];
  const registry: VideoProviderRegistry = {
    register(provider) {
      providers.push(provider);
      return registry;
    },
    providerFor(ref) {
      const found = providers.find((p) => p.supports(ref));
      if (!found) throw new Error(`Kein Video-Provider fuer "${ref.provider}" registriert.`);
      return found;
    },
    resolvePlayback(ref, now = new Date()) {
      return registry.providerFor(ref).resolvePlayback(ref, now);
    },
  };
  return registry;
}

// --------------------------------------------------------------------------
// Parsen aus content_blocks.config (fail-closed)
// --------------------------------------------------------------------------

/**
 * Liest die VideoRef aus einer video-Block-Konfiguration
 * (videoConfigSchema in @handel-offensiv/validation). Liefert null bei
 * unbekannter/ungueltiger Struktur – der Block zeigt dann einen Hinweis statt
 * eines Players.
 */
export function parseVideoRef(config: unknown): VideoRef | null {
  if (typeof config !== 'object' || config === null) return null;
  const c = config as Record<string, unknown>;
  if (c.provider === 'storage' && typeof c.storagePath === 'string' && c.storagePath.length > 0) {
    return {
      provider: 'storage',
      storagePath: c.storagePath,
      ...(typeof c.bucket === 'string' && c.bucket.length > 0 ? { bucket: c.bucket } : {}),
    };
  }
  if (c.provider === 'external' && typeof c.url === 'string' && c.url.startsWith('https://')) {
    return { provider: 'external', url: c.url };
  }
  return null;
}
