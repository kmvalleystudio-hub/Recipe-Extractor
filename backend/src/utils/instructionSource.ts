import type { RecipeExtraction } from '../schemas/recipe';
import { extractInstructionsFromCaption } from './instructionExtract';
import { captionHasIngredientList } from './parseCaptionIngredients';

export const DIRECTIONS_UNAVAILABLE_NOTE =
  'No narration or written cooking steps were found for this video. Directions were not generated — ingredients are from the post caption. Watch the video for the method.';

export interface InstructionSourceInput {
  sources: string[];
  /** Spoken transcript or YouTube captions (not post caption alone) */
  spokenTranscript: string;
  postCaption?: string;
  combinedTranscript: string;
}

/** True when the source text plausibly contains cooking steps — not just an ingredient list */
export function hasInstructionSource(input: InstructionSourceInput): boolean {
  if (input.sources.includes('manualTranscript')) return true;

  const spoken = input.spokenTranscript.trim();
  const hasNarration =
    spoken.length > 0 &&
    (input.sources.includes('audio_transcription') || input.sources.includes('transcript'));

  if (hasNarration && spoken.split(/\s+/).filter(Boolean).length >= 15) {
    return true;
  }

  const caption = input.postCaption?.trim() ?? '';
  if (extractInstructionsFromCaption(caption).length > 0) {
    return true;
  }

  if (!caption && extractInstructionsFromCaption(input.combinedTranscript).length > 0) {
    return true;
  }

  if (caption && captionHasIngredientList(caption)) {
    return false;
  }

  return false;
}

/** Drop AI-invented steps when the video/post has no narrated or written directions */
export function enforceInstructionSource(
  recipe: RecipeExtraction,
  input: InstructionSourceInput
): RecipeExtraction {
  if (hasInstructionSource(input)) {
    return recipe;
  }

  const existingNotes = recipe.missingDetailsSummary.filter(
    (n) => n.trim() !== DIRECTIONS_UNAVAILABLE_NOTE
  );

  return {
    ...recipe,
    instructions: [],
    missingDetailsSummary: [DIRECTIONS_UNAVAILABLE_NOTE, ...existingNotes],
    confidenceScore:
      recipe.confidenceScore?.toLowerCase() === 'high' ? 'medium' : recipe.confidenceScore,
  };
}
