/** Client-side thumbnail helpers */

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/i,
];

/** Prefer slot 3 (end-of-video auto thumb) when falling back on the client */
export function getYouTubeThumbnailFromUrl(videoUrl: string): string | undefined {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = videoUrl.match(pattern);
    if (match?.[1]) {
      return `https://i.ytimg.com/vi/${match[1]}/3.jpg`;
    }
  }
  return undefined;
}

export function resolveRecipeThumbnail(
  thumbnailUrl?: string,
  videoUrl?: string
): string | undefined {
  if (thumbnailUrl?.trim()) return thumbnailUrl.trim();
  if (videoUrl?.trim()) return getYouTubeThumbnailFromUrl(videoUrl);
  return undefined;
}
