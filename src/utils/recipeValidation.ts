import type { ExtractRecipeResponse, RecipeExtraction } from '@/types/recipe';
import { formatIngredientLine } from '@/utils/ingredientFormat';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function validateExtractedField(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const field = value as Record<string, unknown>;
  return (
    isString(field.extracted) &&
    isString(field.status) &&
    isString(field.suggested) &&
    isString(field.reason)
  );
}

/** Validate the structured recipe object */
export function validateRecipeResponse(data: unknown): data is RecipeExtraction {
  if (!data || typeof data !== 'object') return false;

  const recipe = data as Record<string, unknown>;

  if (!isString(recipe.recipeTitle) || recipe.recipeTitle.trim().length === 0) return false;
  if (!isString(recipe.sourceVideoUrl)) return false;
  if (!validateExtractedField(recipe.servings)) return false;
  if (!validateExtractedField(recipe.prepTime)) return false;
  if (!validateExtractedField(recipe.cookTime)) return false;
  if (!validateExtractedField(recipe.totalTime)) return false;
  if (!Array.isArray(recipe.ingredients)) return false;
  if (!Array.isArray(recipe.instructions)) return false;
  if (!Array.isArray(recipe.videoNotes)) return false;
  if (!Array.isArray(recipe.alternativeIngredients)) return false;

  return true;
}

function validateSourceContent(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const content = data as Record<string, unknown>;
  return (
    isString(content.transcript) &&
    isString(content.title) &&
    isString(content.description) &&
    isString(content.platform) &&
    Array.isArray(content.sources)
  );
}

/** Validate full extract API response including source transcript */
export function validateExtractResponse(data: unknown): data is ExtractRecipeResponse {
  if (!data || typeof data !== 'object') return false;
  const response = data as Record<string, unknown>;
  return validateRecipeResponse(response.recipe) && validateSourceContent(response.sourceContent);
}

const NOT_INDICATED = 'not indicated';

export function isNotIndicated(value: string): boolean {
  return value.trim().toLowerCase() === NOT_INDICATED;
}

export function formatRecipeForCopy(recipe: RecipeExtraction): string {
  const lines: string[] = [
    recipe.recipeTitle,
    '',
    recipe.description,
    '',
    `Servings: ${recipe.servings.extracted}`,
    `Prep: ${recipe.prepTime.extracted} | Cook: ${recipe.cookTime.extracted} | Total: ${recipe.totalTime.extracted}`,
    '',
    'INGREDIENTS',
    ...recipe.ingredients.map((i) => `- ${formatIngredientLine(i)}`),
    '',
    'INSTRUCTIONS',
    ...recipe.instructions.map((s) => `${s.stepNumber}. ${s.instruction}`),
    '',
    'Source: ' + recipe.sourceVideoUrl,
  ];
  return lines.join('\n');
}

export function formatIngredientsForCopy(recipe: RecipeExtraction): string {
  return recipe.ingredients.map((i) => formatIngredientLine(i)).join('\n');
}

export function formatAlternativesForCopy(recipe: RecipeExtraction): string {
  if (recipe.alternativeIngredients.length === 0) {
    return 'No alternative ingredients available.';
  }
  return recipe.alternativeIngredients
    .map(
      (a) =>
        `${a.originalIngredient} → ${a.alternativeIngredient}\n` +
        `Ratio: ${a.replacementRatio}\n` +
        `Why: ${a.whyItWorks}\n` +
        `Impact: ${a.flavorTextureImpact}` +
        (a.dietaryNote ? `\nDietary: ${a.dietaryNote}` : '')
    )
    .join('\n\n');
}

export function formatTranscriptForCopy(source: import('@/types/recipe').SourceContent): string {
  const parts: string[] = [];
  if (source.title) parts.push(`Title: ${source.title}`);
  if (source.description) parts.push(`Description: ${source.description}`);
  if (source.postCaption?.trim()) {
    parts.push('', '[Post caption]', source.postCaption.trim());
  }
  if (source.transcript?.trim()) {
    parts.push('', '[Spoken transcript]', source.transcript.trim());
  }
  return parts.join('\n') || 'No transcript available.';
}
