import type { SupportedPlatform, UrlValidationResult } from '@/types/recipe';

const YOUTUBE_PATTERNS = [
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=[\w-]+/i,
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/[\w-]+/i,
  /^(?:https?:\/\/)?(?:www\.)?youtu\.be\/[\w-]+/i,
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/[\w-]+/i,
];

const TIKTOK_PATTERNS = [
  /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
  /^(?:https?:\/\/)?(?:vm\.)?tiktok\.com\/[\w]+/i,
];

const INSTAGRAM_PATTERNS = [
  /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|p)\/[\w-]+/i,
];

const FACEBOOK_PATTERNS = [
  /^(?:https?:\/\/)?(?:www\.)?facebook\.com\/watch/i,
  /^(?:https?:\/\/)?(?:www\.)?facebook\.com\/.*\/videos\/\d+/i,
  /^(?:https?:\/\/)?(?:www\.)?facebook\.com\/reel\/\d+/i,
  /^(?:https?:\/\/)?(?:www\.)?facebook\.com\/video\.php/i,
  /^(?:https?:\/\/)?(?:www\.)?facebook\.com\/share\/(?:r|v)\//i,
  /^(?:https?:\/\/)?(?:www\.)?fb\.watch\//i,
  /^(?:https?:\/\/)?(?:m\.)?facebook\.com/i,
];

function detectPlatform(url: string): SupportedPlatform {
  if (YOUTUBE_PATTERNS.some((p) => p.test(url))) return 'youtube';
  if (FACEBOOK_PATTERNS.some((p) => p.test(url))) return 'facebook';
  if (TIKTOK_PATTERNS.some((p) => p.test(url))) return 'tiktok';
  if (INSTAGRAM_PATTERNS.some((p) => p.test(url))) return 'instagram';
  return 'unknown';
}

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Validate and normalize a cooking video URL before sending to the backend */
export function validateVideoUrl(input: string): UrlValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { isValid: false, platform: 'unknown', error: 'Please enter a video URL.' };
  }

  if (!isValidHttpUrl(trimmed)) {
    return {
      isValid: false,
      platform: 'unknown',
      error: 'Please enter a valid URL (e.g. https://youtube.com/watch?v=...).',
    };
  }

  const normalizedUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  const platform = detectPlatform(normalizedUrl);

  if (platform === 'unknown') {
    return {
      isValid: false,
      platform,
      error:
        'This video platform is not supported yet. Supported: YouTube and Facebook. TikTok and Instagram are coming soon.',
    };
  }

  if (platform === 'tiktok' || platform === 'instagram') {
    return {
      isValid: false,
      platform,
      error: `${platform === 'tiktok' ? 'TikTok' : 'Instagram'} videos are not supported yet. Please try a YouTube cooking video URL.`,
    };
  }

  return { isValid: true, platform, normalizedUrl };
}

/**
 * Validate URL for extraction.
 * When manualTranscript is provided (testing mode), only a non-empty source URL is required.
 * Otherwise, full platform validation applies (YouTube only for now).
 */
export function validateExtractRequest(
  input: string,
  manualTranscript?: string
): UrlValidationResult {
  if (manualTranscript?.trim()) {
    const trimmed = input.trim();
    if (!trimmed) {
      return {
        isValid: false,
        platform: 'unknown',
        error: 'Enter a source video URL (used to label the recipe, even in manual test mode).',
      };
    }
    const normalizedUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    return { isValid: true, platform: 'unknown', normalizedUrl };
  }

  return validateVideoUrl(input);
}
