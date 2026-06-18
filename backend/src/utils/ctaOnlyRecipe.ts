import type { RecipeExtraction } from '../schemas/recipe';

const emptyField = () => ({
  extracted: 'not indicated',
  status: 'not available',
  suggested: '',
  reason: '',
});

/** Title-only response when Facebook caption is CTA-only and audio transcript is missing */
export function buildCtaOnlyRecipe(
  videoUrl: string,
  recipeTitle: string,
  setupHint: string
): RecipeExtraction {
  return {
    recipeTitle,
    description:
      'This video post does not include the full recipe in text — only a link or comment prompt. Ingredients and steps require a spoken audio transcript.',
    sourceVideoUrl: videoUrl,
    confidenceScore: 'low',
    servings: emptyField(),
    prepTime: emptyField(),
    cookTime: emptyField(),
    totalTime: emptyField(),
    ingredients: [],
    instructions: [],
    videoNotes: [],
    missingDetailsSummary: [
      'Post caption is engagement-only (e.g. "comment for full recipe") — no ingredient list in the caption.',
      'The real recipe is spoken in the video. Enable audio transcription to extract it.',
      setupHint,
    ],
    alternativeIngredients: [],
  };
}
