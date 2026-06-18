import { isEngagementOrCtaTitle } from './recipeTitle';

/** Signals that text contains actual recipe content (not just a dish name + CTA) */
const RECIPE_CONTENT_RE =
  /\b(\d+\s*(?:g|kg|ml|l|oz|lb|lbs|cup|cups|tbsp|tsp|teaspoon|tablespoon|clove|cloves|piece|pieces|slice|slices|pinch|dash|head|stalk|sprig|can|cans|packet|pack|bunch|inch|inches|cm|mm|hour|hours|minute|minutes|min|sec|°|deg|fahrenheit|celsius))\b/i;

const INGREDIENT_LIST_RE =
  /\b(marinade|dressing|sauce|glaze|for the|ingredients|instructions|steps|mix together|add the|season with|bake at|roast at|fry for|simmer|marinate)\b/i;

const CTA_ONLY_RE =
  /\b(comment\s+\w+|i\s+will\s+dm|will\s+dm\s+you|dm\s+me|dm\s+you|full\s+recipe|link\s+in\s+bio|follow\s+for)\b/i;

export type SourceQualityLevel = 'full' | 'partial' | 'cta_only' | 'empty';

export interface SourceQuality {
  level: SourceQualityLevel;
  hasSpokenTranscript: boolean;
  hasPostCaption: boolean;
  captionLooksLikeRecipe: boolean;
  reasons: string[];
}

export function captionLooksLikeRecipe(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 80) return false;
  if (RECIPE_CONTENT_RE.test(trimmed)) return true;
  if (INGREDIENT_LIST_RE.test(trimmed) && trimmed.split(/\s+/).length >= 40) return true;
  // Multi-line captions with several short lines often list ingredients
  const lines = trimmed.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 4 && RECIPE_CONTENT_RE.test(trimmed)) return true;
  return false;
}

export function isCtaOnlyCaption(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (captionLooksLikeRecipe(trimmed)) return false;
  return CTA_ONLY_RE.test(trimmed) || isEngagementOrCtaTitle(trimmed);
}

export function evaluateSourceQuality(input: {
  platform: string;
  transcript: string;
  postCaption?: string;
  sources: string[];
}): SourceQuality {
  const spoken = input.transcript.trim();
  const caption = input.postCaption?.trim() ?? '';
  const hasSpokenTranscript =
    spoken.length > 0 &&
    (input.sources.includes('audio_transcription') || input.sources.includes('transcript'));
  const hasPostCaption = caption.length > 0;
  const captionRecipe = captionLooksLikeRecipe(caption);
  const reasons: string[] = [];

  if (hasSpokenTranscript) {
    if (spoken.split(/\s+/).length >= 50) {
      return {
        level: 'full',
        hasSpokenTranscript: true,
        hasPostCaption,
        captionLooksLikeRecipe: captionRecipe,
        reasons: ['Spoken transcript or captions available'],
      };
    }
    reasons.push('Spoken transcript is very short');
  }

  if (captionRecipe) {
    return {
      level: hasSpokenTranscript ? 'full' : 'partial',
      hasSpokenTranscript,
      hasPostCaption,
      captionLooksLikeRecipe: true,
      reasons: hasSpokenTranscript
        ? ['Post caption and spoken transcript']
        : ['Post caption contains ingredient/step details'],
    };
  }

  if (hasPostCaption && isCtaOnlyCaption(caption)) {
    reasons.push('Post caption is engagement text only (e.g. "comment for recipe")');
    reasons.push('Spoken audio transcript is required for ingredient extraction');
    return {
      level: 'cta_only',
      hasSpokenTranscript: false,
      hasPostCaption: true,
      captionLooksLikeRecipe: false,
      reasons,
    };
  }

  if (!spoken && !caption) {
    return {
      level: 'empty',
      hasSpokenTranscript: false,
      hasPostCaption: false,
      captionLooksLikeRecipe: false,
      reasons: ['No caption or transcript available'],
    };
  }

  if (spoken.length > 0 && input.sources.includes('caption') && !hasSpokenTranscript) {
    // YouTube-style: transcript field is captions
    return {
      level: spoken.split(/\s+/).length >= 30 ? 'full' : 'partial',
      hasSpokenTranscript: true,
      hasPostCaption,
      captionLooksLikeRecipe: captionRecipe,
      reasons: ['Video captions available'],
    };
  }

  return {
    level: 'partial',
    hasSpokenTranscript,
    hasPostCaption,
    captionLooksLikeRecipe: captionRecipe,
    reasons: ['Limited source text — extraction may be incomplete'],
  };
}

/** User-facing setup hint when Facebook audio transcription is missing */
export const TRANSCRIPTION_SETUP_HINT =
  'Install yt-dlp and ffmpeg, then set OPENAI_API_KEY or run a local Whisper API (WHISPER_API_URL). Restart the backend and re-extract.';
