import { extractYouTubeVideoId } from './urlValidation';
import { scoreThumbnailFromBuffer } from './thumbnailQuality';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/** Public YouTube thumbnail URLs (no API key required) */
export function getYouTubeThumbnailUrl(videoId: string, quality: 'max' | 'high' = 'max'): string {
  const file = quality === 'max' ? 'maxresdefault.jpg' : 'hqdefault.jpg';
  return `https://i.ytimg.com/vi/${videoId}/${file}`;
}

/** YouTube auto-generated thumb slots: 1 ≈ start, 2 ≈ middle, 3 ≈ end (cooked/plated) */
export function getYouTubeAutoThumbnailUrl(videoId: string, slot: 1 | 2 | 3): string {
  return `https://i.ytimg.com/vi/${videoId}/${slot}.jpg`;
}

async function fetchThumbnailBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, { headers: BROWSER_HEADERS, redirect: 'follow' });
    if (!response.ok) return null;
    const length = Number(response.headers.get('content-length') ?? 0);
    if (length > 0 && length < 2500) return null;
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength < 2500) return null;
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

function parseStoryboardLastFrameUrl(spec: string): string | null {
  const parts = spec.split('|');
  const template = parts[0];
  if (!template.includes('$L') || !template.includes('$N')) return null;

  const levelSpecs = parts.slice(1).filter((p) => p.includes('#'));
  if (levelSpecs.length === 0) return null;

  const levelIndex = levelSpecs.length - 1;
  const fields = levelSpecs[levelIndex].split('#');
  const frameCount = parseInt(fields[2] ?? '0', 10);
  if (!frameCount || frameCount < 1) return null;

  const lastFrame = frameCount - 1;
  return template.replace('$L', String(levelIndex)).replace('$N', String(lastFrame));
}

async function fetchYouTubeStoryboardEndUrl(videoId: string): Promise<string | null> {
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(watchUrl, { headers: BROWSER_HEADERS, redirect: 'follow' });
    if (!response.ok) return null;

    const html = await response.text();
    const match =
      html.match(/"playerStoryboardSpecRenderer"\s*:\s*\{\s*"spec"\s*:\s*"([^"]+)"/) ??
      html.match(/"spec"\s*:\s*"((?:https?:\\\/\\\/|https:\/\/)[^"]*storyboard[^"]+)"/);

    if (!match?.[1]) return null;

    const spec = match[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
    return parseStoryboardLastFrameUrl(spec);
  } catch {
    return null;
  }
}

interface ScoredCandidate {
  url: string;
  timeliness: number;
  quality: number;
  acceptable: boolean;
  width: number;
  height: number;
  sharpness: number;
}

/** Higher = closer to end of video (cooked/plated) */
const TIMELINESS: Record<string, number> = {
  storyboard: 1,
  slot3: 0.92,
  slot2: 0.75,
  maxres: 0.6,
  hq: 0.45,
};

function rankScore(candidate: ScoredCandidate): number {
  return candidate.quality * 0.68 + candidate.timeliness * 0.32;
}

async function scoreCandidate(
  url: string,
  timelinessKey: keyof typeof TIMELINESS
): Promise<ScoredCandidate | null> {
  const buffer = await fetchThumbnailBuffer(url);
  if (!buffer) return null;

  const scored = await scoreThumbnailFromBuffer(buffer);
  if (!scored) return null;

  return {
    url,
    timeliness: TIMELINESS[timelinessKey],
    quality: scored.quality,
    acceptable: scored.acceptable,
    width: scored.width,
    height: scored.height,
    sharpness: scored.sharpness,
  };
}

/**
 * Pick the best YouTube thumbnail: sharp + high-res, preferring late-video frames when quality allows.
 * Rejects tiny storyboard tiles and blurry images automatically.
 */
export async function pickYouTubeThumbnailPreferFinished(videoId: string): Promise<string> {
  const storyboardUrl = await fetchYouTubeStoryboardEndUrl(videoId);

  const candidateDefs: { url: string; key: keyof typeof TIMELINESS }[] = [
    ...(storyboardUrl ? [{ url: storyboardUrl, key: 'storyboard' as const }] : []),
    { url: getYouTubeAutoThumbnailUrl(videoId, 3), key: 'slot3' },
    { url: getYouTubeAutoThumbnailUrl(videoId, 2), key: 'slot2' },
    { url: getYouTubeThumbnailUrl(videoId, 'max'), key: 'maxres' },
    { url: getYouTubeThumbnailUrl(videoId, 'high'), key: 'hq' },
  ];

  const scored = (
    await Promise.all(candidateDefs.map(({ url, key }) => scoreCandidate(url, key)))
  ).filter((c): c is ScoredCandidate => c !== null);

  if (scored.length === 0) {
    return getYouTubeThumbnailUrl(videoId);
  }

  const acceptable = scored.filter((c) => c.acceptable);
  const pool = acceptable.length > 0 ? acceptable : scored;

  pool.sort((a, b) => rankScore(b) - rankScore(a));

  return pool[0]?.url ?? getYouTubeThumbnailUrl(videoId);
}

export function getThumbnailUrlForVideo(videoUrl: string): string | undefined {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (videoId) return getYouTubeAutoThumbnailUrl(videoId, 3);
  return undefined;
}

export async function getThumbnailUrlForVideoAsync(videoUrl: string): Promise<string | undefined> {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (videoId) return pickYouTubeThumbnailPreferFinished(videoId);
  return undefined;
}
