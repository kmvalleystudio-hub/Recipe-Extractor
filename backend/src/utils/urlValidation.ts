import { normalizeFacebookWatchUrl } from './facebook';

export type SupportedPlatform = 'youtube' | 'facebook' | 'tiktok' | 'instagram' | 'unknown';

export { extractFacebookVideoId, normalizeFacebookWatchUrl } from './facebook';

export interface UrlValidationResult {
  isValid: boolean;
  platform: SupportedPlatform;
  normalizedUrl?: string;
  error?: string;
}

const YOUTUBE_PATTERNS = [
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/i,
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([\w-]+)/i,
  /^(?:https?:\/\/)?(?:www\.)?youtu\.be\/([\w-]+)/i,
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]+)/i,
];

export function extractYouTubeVideoId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

const FACEBOOK_PATTERNS = [
  /facebook\.com\/watch/i,
  /facebook\.com\/.*\/videos\/\d+/i,
  /facebook\.com\/reel\/\d+/i,
  /facebook\.com\/video\.php/i,
  /facebook\.com\/share\/(?:r|v)\//i,
  /fb\.watch\//i,
  /m\.facebook\.com/i,
];

export function detectPlatform(url: string): SupportedPlatform {
  if (extractYouTubeVideoId(url)) return 'youtube';
  if (FACEBOOK_PATTERNS.some((p) => p.test(url))) return 'facebook';
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  if (/instagram\.com/i.test(url)) return 'instagram';
  return 'unknown';
}

export function validateVideoUrl(input: string): UrlValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { isValid: false, platform: 'unknown', error: 'Video URL is required.' };
  }

  let normalizedUrl: string;
  try {
    normalizedUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalizedUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, platform: 'unknown', error: 'Invalid URL protocol.' };
    }
  } catch {
    return { isValid: false, platform: 'unknown', error: 'Invalid URL format.' };
  }

  const platform = detectPlatform(normalizedUrl);

  if (platform === 'unknown') {
    return {
      isValid: false,
      platform,
      error: 'Unsupported video platform. Supported: YouTube and Facebook.',
    };
  }

  if (platform === 'tiktok' || platform === 'instagram') {
    return {
      isValid: false,
      platform,
      error: `${platform === 'tiktok' ? 'TikTok' : 'Instagram'} is not supported yet.`,
    };
  }

  if (platform === 'facebook') {
    normalizedUrl = normalizeFacebookWatchUrl(normalizedUrl);
  }

  return { isValid: true, platform, normalizedUrl };
}
