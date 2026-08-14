import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { seedToAvatarParams } from '@/lib/avatar/params';
import { renderAvatarScene } from '@/lib/avatar/avatar-scene';

// Stateless per-user blob avatar. (seed, v, size) fully determine the bytes, so
// the URL IS the cache key — render on the fly, never persist pixels.
export const runtime = 'edge';

export async function GET(request: NextRequest, { params }: { params: Promise<{ seed: string }> }) {
  const { seed: rawSeed } = await params;
  const seed = decodeURIComponent(rawSeed || 'default');
  const sp = request.nextUrl.searchParams;
  const sizeRaw = parseInt(sp.get('size') || '256', 10);
  const size = Math.max(16, Math.min(1024, Number.isNaN(sizeRaw) ? 256 : sizeRaw));
  const version = parseInt(sp.get('v') || '1', 10) || 1;

  const p = seedToAvatarParams(seed, version);

  return new ImageResponse(renderAvatarScene(p, size), {
    width: size,
    height: size,
    headers: {
      'Cache-Control': 'public, immutable, no-transform, max-age=31536000',
    },
  });
}
