import { YoutubeTranscript } from 'youtube-transcript';
import { detectPlatform, extractYouTubeVideoId } from '../utils/urlValidation';
import { fetchFacebookOpenGraph } from '../utils/facebook';
import { extractRecipeTitleFromCaption } from '../utils/recipeTitle';
import { pickYouTubeThumbnailPreferFinished } from '../utils/thumbnails';
import { fixCommonIngredientTypos } from '../utils/ingredientDedupe';
import { transcribeVideoAudio } from './audioTranscription';

export interface VideoContent {
  platform: string;
  videoId?: string;
  title: string;
  description: string;
  /** Spoken words — YouTube captions or audio transcription */
  transcript: string;
  /** Facebook/Instagram post caption (separate from spoken audio) */
  postCaption?: string;
  thumbnailUrl: string;
  metadata: Record<string, string>;
  sources: string[];
}

/** Text passed to AI extraction — combines caption + spoken transcript when both exist */
export function buildExtractionTranscript(content: Pick<VideoContent, 'transcript' | 'postCaption'>): string {
  const spoken = content.transcript.trim();
  const caption = content.postCaption?.trim() ?? '';

  if (spoken && caption) {
    return `[Post caption]\n${caption}\n\n[Spoken transcript]\n${spoken}`;
  }
  return spoken || caption;
}

/** Fetch oEmbed metadata for YouTube videos (title, author) */
async function fetchYouTubeOEmbed(videoUrl: string): Promise<{ title: string; author: string }> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) return { title: '', author: '' };
    const data = (await response.json()) as { title?: string; author_name?: string };
    return { title: data.title ?? '', author: data.author_name ?? '' };
  } catch {
    return { title: '', author: '' };
  }
}

/** Language variants to try when fetching YouTube captions */
function captionLangVariants(preferredLang: string): string[] {
  const base = preferredLang.toLowerCase().split('-')[0];
  const variants: string[] = [preferredLang, base];

  if (base === 'en') {
    variants.push('en-US', 'en-GB', 'a.en', 'en.a');
  } else if (base === 'zh') {
    variants.push('zh-CN', 'zh-TW', 'zh-Hans', 'zh-Hant');
  } else if (base === 'pt') {
    variants.push('pt-BR', 'pt-PT');
  }

  return [...new Set(variants)];
}

/**
 * Fetch transcript/captions from YouTube.
 * User-selected language is tried first to avoid wrong auto-translated tracks.
 */
async function fetchYouTubeTranscript(videoId: string, preferredLang: string): Promise<string> {
  const tryFetch = async (lang: string) => {
    const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang });
    return segments.map((s) => s.text).join(' ');
  };

  const langsToTry = captionLangVariants(preferredLang);

  for (const lang of langsToTry) {
    try {
      const text = await tryFetch(lang);
      if (text.trim()) return text;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.toLowerCase().includes('disabled')) {
        throw new Error('CAPTIONS_DISABLED');
      }
    }
  }

  throw new Error('CAPTIONS_UNAVAILABLE');
}

async function fetchYouTubeContent(
  videoUrl: string,
  language: string
): Promise<VideoContent> {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) {
    throw new Error('Could not parse YouTube video ID.');
  }

  const sources: string[] = [];
  const oembed = await fetchYouTubeOEmbed(videoUrl);
  if (oembed.title) sources.push('title');
  if (oembed.author) sources.push('author');
  sources.push('thumbnail');

  let transcript = '';
  try {
    transcript = await fetchYouTubeTranscript(videoId, language);
    if (transcript) sources.push('transcript');
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'CAPTIONS_DISABLED' || code === 'CAPTIONS_UNAVAILABLE') {
      const audioResult = await transcribeVideoAudio(videoUrl, 'youtube', language);
      if (audioResult) {
        transcript = fixCommonIngredientTypos(audioResult.text);
        sources.push('audio_transcription');
      }
    } else {
      throw error;
    }
  }

  const description = oembed.author ? `Channel: ${oembed.author}` : '';

  if (!transcript && !oembed.title && !description) {
    throw new Error(
      'Not enough content available. Captions or transcript are unavailable for this video, and no description was found.'
    );
  }

  return {
    platform: 'youtube',
    videoId,
    title: oembed.title,
    description,
    transcript,
    thumbnailUrl: await pickYouTubeThumbnailPreferFinished(videoId),
    metadata: {
      videoId,
      author: oembed.author,
      url: videoUrl,
      captionLanguage: language,
    },
    sources,
  };
}

async function fetchFacebookContent(videoUrl: string, language: string): Promise<VideoContent> {
  const sources: string[] = [];
  const og = await fetchFacebookOpenGraph(videoUrl);

  const postCaption = (og.caption || og.description || og.title).trim();

  if (postCaption) sources.push('caption');
  if (og.author) sources.push('author');
  if (og.thumbnailUrl) sources.push('thumbnail');

  const description = og.author ? `Page: ${og.author}` : '';

  let transcript = '';
  const audioResult = await transcribeVideoAudio(videoUrl, 'facebook', language);
  if (audioResult?.text) {
    transcript = fixCommonIngredientTypos(audioResult.text);
    sources.push('audio_transcription');
  }

  if (!transcript && !postCaption && !og.author) {
    throw new Error(
      'Could not load this Facebook video. It may be private, region-restricted, or require login. ' +
        'Install yt-dlp + ffmpeg for spoken transcript, or paste transcript text in manualTranscript when testing.'
    );
  }

  return {
    platform: 'facebook',
    title: og.title || extractRecipeTitleFromCaption(postCaption),
    description,
    transcript,
    postCaption: postCaption || undefined,
    thumbnailUrl: og.thumbnailUrl,
    metadata: {
      url: videoUrl,
      author: og.author,
      captionLanguage: language,
      sourceType: transcript ? 'facebook_audio' : 'facebook_caption',
    },
    sources,
  };
}

/**
 * Gather all legally accessible text content from a video URL.
 * Only processes publicly accessible data — no scraping of private content.
 */
export async function fetchVideoContent(
  videoUrl: string,
  language: string
): Promise<VideoContent> {
  const platform = detectPlatform(videoUrl);

  if (platform === 'youtube') {
    return fetchYouTubeContent(videoUrl, language);
  }

  if (platform === 'facebook') {
    return fetchFacebookContent(videoUrl, language);
  }

  throw new Error(`Platform "${platform}" is not supported.`);
}
