import type { RecipeExtraction } from '../schemas/recipe';
import {
  captionHasIngredientList,
  parseCaptionIngredients,
  type ParsedCaptionIngredient,
} from './parseCaptionIngredients';

type Ingredient = RecipeExtraction['ingredients'][number];

function toIngredient(parsed: ParsedCaptionIngredient): Ingredient {
  return {
    name: parsed.name,
    extractedAmount: parsed.extractedAmount,
    unitOrSize: 'not indicated',
    usage: parsed.usage,
    status: 'From post caption',
    suggestedAmount: '',
    reasonForSuggestion: '',
  };
}

/**
 * When Facebook caption contains a full bullet ingredient list, use it as source of truth.
 * Fixes AI dropping items, wrong amounts (-3 pcs), and merged sauce lines.
 */
export function applyCaptionIngredients(
  recipe: RecipeExtraction,
  postCaption?: string
): RecipeExtraction {
  if (!postCaption?.trim() || !captionHasIngredientList(postCaption)) {
    return recipe;
  }

  const parsed = parseCaptionIngredients(postCaption);
  if (parsed.length < 3) return recipe;

  return {
    ...recipe,
    ingredients: parsed.map(toIngredient),
  };
}
