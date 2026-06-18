/** Extract numeric Facebook video ID from common URL formats */
import { extractRecipeTitleFromCaption } from './recipeTitle';

export function extractFacebookVideoId(url: string): string | null {
  const patterns = [
    /facebook\.com\/reel\/(\d+)/i,
    /facebook\.com\/watch\/?\?[^#]*\bv=(\d+)/i,
    /facebook\.com\/[^/?#]+\/videos\/(\d+)/i,
    /facebook\.com\/video\.php\?[^#]*\bv=(\d+)/i,
    /facebook\.com\/share\/(?:r|v)\/(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

/** Canonical watch URL — reel URLs return 400 from Facebook without this conversion */
export function normalizeFacebookWatchUrl(url: string): string {
  const videoId = extractFacebookVideoId(url);
  if (videoId) {
    return `https://www.facebook.com/watch/?v=${videoId}`;
  }
  return url;
}

function extractOgMeta(html: string, property: string): string {
  const patterns = [
    new RegExp(`property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i'),
    new RegExp(`name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return '';
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

/** Parse page title — often "Caption text | Page Name" on Facebook */
export function parseFacebookPageTitle(rawTitle: string): { title: string; author: string } {
  const decoded = decodeHtmlEntities(rawTitle).trim();
  const pipeIndex = decoded.lastIndexOf(' | ');
  if (pipeIndex > 0) {
    return {
      title: cleanFacebookCaption(decoded.slice(0, pipeIndex).trim()),
      author: decoded.slice(pipeIndex + 3).trim(),
    };
  }
  return { title: cleanFacebookCaption(decoded), author: '' };
}

/** Strip "123K views · 5K reactions |" prefix from Facebook og:title */
export function cleanFacebookCaption(text: string): string {
  const parts = text.split(' | ');
  if (parts.length >= 2 && /\bviews\b/i.test(parts[0])) {
    return parts.slice(1).join(' | ').trim();
  }
  return text.trim();
}

export interface FacebookOpenGraph {
  title: string;
  description: string;
  author: string;
  /** Full post caption — longest text found from OG or embedded page data */
  caption: string;
  /** og:image preview thumbnail when available */
  thumbnailUrl: string;
}

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Accept: 'text/html,application/xhtml+xml',
};

function unescapeEmbeddedJsonString(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return raw
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

/** Try to pull the full post caption from embedded JSON in Facebook HTML */
export function extractFacebookCaptionFromHtml(html: string): string {
  const patterns = [
    /"message"\s*:\s*\{[^}]*"text"\s*:\s*"((?:\\.|[^"\\])*)"/g,
    /"post_message"\s*:\s*"((?:\\.|[^"\\])*)"/g,
    /"body"\s*:\s*\{[^}]*"text"\s*:\s*"((?:\\.|[^"\\])*)"/g,
  ];

  let best = '';
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const text = unescapeEmbeddedJsonString(match[1]).trim();
      if (text.length > best.length) best = text;
    }
  }
  return best;
}

function pickLongestCaption(...candidates: string[]): string {
  return candidates.reduce((best, next) => {
    const trimmed = next.trim();
    return trimmed.length > best.length ? trimmed : best;
  }, '');
}

/**
 * Fetch public Open Graph metadata for a Facebook video.
 * Reel URLs are normalized to watch?v= first (direct reel pages often return 400).
 */
export async function fetchFacebookOpenGraph(videoUrl: string): Promise<FacebookOpenGraph> {
  let resolvedUrl = normalizeFacebookWatchUrl(videoUrl);

  if (/fb\.watch\//i.test(videoUrl) && !extractFacebookVideoId(resolvedUrl)) {
    try {
      const head = await fetch(videoUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: BROWSER_HEADERS,
      });
      resolvedUrl = normalizeFacebookWatchUrl(head.url);
    } catch {
      // fall through with original URL
    }
  }

  const response = await fetch(resolvedUrl, {
    headers: BROWSER_HEADERS,
    redirect: 'follow',
  });

  if (!response.ok) {
    return { title: '', description: '', author: '', caption: '', thumbnailUrl: '' };
  }

  const html = await response.text();
  const ogTitle = decodeHtmlEntities(extractOgMeta(html, 'og:title'));
  const ogDescription = decodeHtmlEntities(extractOgMeta(html, 'og:description'));
  const ogImage = decodeHtmlEntities(extractOgMeta(html, 'og:image'));
  const htmlTitle = decodeHtmlEntities((html.match(/<title[^>]*>([^<]+)/i) ?? [])[1] ?? '');
  const embeddedCaption = extractFacebookCaptionFromHtml(html);

  const fromOg = parseFacebookPageTitle(ogTitle);
  const fromHtml = parseFacebookPageTitle(htmlTitle);

  const author = fromOg.author || fromHtml.author;
  const caption = pickLongestCaption(
    embeddedCaption,
    fromOg.title,
    fromHtml.title,
    ogDescription,
    cleanFacebookCaption(ogTitle)
  );
  const title = extractRecipeTitleFromCaption(caption);
  const description = ogDescription && ogDescription !== caption ? ogDescription : caption;

  return { title, description, author, caption, thumbnailUrl: ogImage };
}
