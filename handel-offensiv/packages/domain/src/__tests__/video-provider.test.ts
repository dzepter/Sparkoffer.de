import { describe, expect, it } from 'vitest';

import {
  createExternalVideoProvider,
  createSupabaseStorageVideoProvider,
  createVideoProviderRegistry,
  parseVideoRef,
} from '../video-provider';

describe('parseVideoRef', () => {
  it('liest Storage- und externe Referenzen aus der Block-Konfiguration', () => {
    expect(parseVideoRef({ provider: 'storage', storagePath: 'm01/intro.mp4', title: 'x' })).toEqual({
      provider: 'storage',
      storagePath: 'm01/intro.mp4',
    });
    expect(parseVideoRef({ provider: 'storage', storagePath: 'a.mp4', bucket: 'videos' })).toEqual({
      provider: 'storage',
      storagePath: 'a.mp4',
      bucket: 'videos',
    });
    expect(parseVideoRef({ provider: 'external', url: 'https://player.example/abc' })).toEqual({
      provider: 'external',
      url: 'https://player.example/abc',
    });
  });

  it('ist fail-closed bei ungueltigen Strukturen', () => {
    expect(parseVideoRef(null)).toBeNull();
    expect(parseVideoRef({ provider: 'storage' })).toBeNull();
    expect(parseVideoRef({ provider: 'external', url: 'http://unsicher' })).toBeNull();
    expect(parseVideoRef({ provider: 'youtube', id: 'x' })).toBeNull();
  });
});

describe('Provider und Registry', () => {
  const now = new Date('2027-03-12T09:00:00+01:00');

  it('Supabase Storage signiert URLs mit TTL und erkennt HLS', async () => {
    const calls: Array<[string, string, number]> = [];
    const provider = createSupabaseStorageVideoProvider({
      signUrl: async (bucket, path, ttl) => {
        calls.push([bucket, path, ttl]);
        return `https://signed.example/${bucket}/${path}?token=t`;
      },
      ttlSeconds: 600,
    });
    const file = await provider.resolvePlayback({ provider: 'storage', storagePath: 'm01/intro.mp4' }, now);
    expect(file).toEqual({
      kind: 'file',
      url: 'https://signed.example/learning-assets/m01/intro.mp4?token=t',
      expiresAt: new Date(now.getTime() + 600_000),
    });
    const hls = await provider.resolvePlayback(
      { provider: 'storage', storagePath: 'm01/intro.m3u8', bucket: 'videos' },
      now,
    );
    expect(hls.kind).toBe('hls');
    expect(calls).toEqual([
      ['learning-assets', 'm01/intro.mp4', 600],
      ['videos', 'm01/intro.m3u8', 600],
    ]);
  });

  it('externer Provider klassifiziert Datei, HLS und Einbettung und erlaubt nur https', async () => {
    const provider = createExternalVideoProvider();
    expect((await provider.resolvePlayback({ provider: 'external', url: 'https://cdn.example/v.mp4' }, now)).kind).toBe('file');
    expect((await provider.resolvePlayback({ provider: 'external', url: 'https://cdn.example/v.m3u8' }, now)).kind).toBe('hls');
    expect((await provider.resolvePlayback({ provider: 'external', url: 'https://player.example/embed/1' }, now)).kind).toBe('embed');
    await expect(
      provider.resolvePlayback({ provider: 'external', url: 'http://cdn.example/v.mp4' }, now),
    ).rejects.toThrow(/https/);
  });

  it('Registry waehlt den passenden Provider und ist fail-closed', async () => {
    const registry = createVideoProviderRegistry()
      .register(createSupabaseStorageVideoProvider({ signUrl: async () => 'https://s.example/x' }))
      .register(createExternalVideoProvider());
    expect(registry.providerFor({ provider: 'storage', storagePath: 'x.mp4' }).id).toBe('supabase-storage');
    expect(registry.providerFor({ provider: 'external', url: 'https://e.example' }).id).toBe('external');
    expect((await registry.resolvePlayback({ provider: 'storage', storagePath: 'x.mp4' }, now)).url).toBe('https://s.example/x');

    const empty = createVideoProviderRegistry();
    expect(() => empty.providerFor({ provider: 'storage', storagePath: 'x.mp4' })).toThrow(/Kein Video-Provider/);
  });
});
