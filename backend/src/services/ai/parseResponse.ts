import { recipeExtractionSchema, type RecipeExtraction } from '../../schemas/recipe';
import { normalizeRecipePayload } from '../../utils/normalizeRecipe';

/** Parse JSON from model output — handles markdown code fences */
export function parseJsonFromModelOutput(text: string): unknown {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenceMatch ? fenceMatch[1].trim() : trimmed;
  return JSON.parse(jsonText);
}

/** Validate and normalize parsed JSON against the recipe schema */
export function validateRecipeJson(
  parsed: unknown,
  providerLabel: string,
  videoUrl: string
): RecipeExtraction {
  const normalized = normalizeRecipePayload(parsed, videoUrl);
  const validated = recipeExtractionSchema.safeParse(normalized);
  if (!validated.success) {
    console.error(`[${providerLabel}] Schema validation failed:`, validated.error.flatten());
    throw new Error('Recipe data did not match the expected format. The model may have returned incomplete JSON.');
  }
  return validated.data;
}
