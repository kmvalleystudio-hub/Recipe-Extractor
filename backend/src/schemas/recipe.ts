import { z } from 'zod';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGE_CODES } from '../constants/languages';

const extractedFieldSchema = z.object({
  extracted: z.string(),
  status: z.string(),
  suggested: z.string(),
  reason: z.string(),
});

export const recipeExtractionSchema = z.object({
  recipeTitle: z.string(),
  description: z.string(),
  sourceVideoUrl: z.string(),
  confidenceScore: z.string(),
  servings: extractedFieldSchema,
  prepTime: extractedFieldSchema,
  cookTime: extractedFieldSchema,
  totalTime: extractedFieldSchema,
  ingredients: z.array(
    z.object({
      name: z.string(),
      extractedAmount: z.string(),
      unitOrSize: z.string(),
      /** marination | cooking | sauce | garnish | both | not indicated */
      usage: z.string().default('not indicated'),
      status: z.string(),
      suggestedAmount: z.string(),
      reasonForSuggestion: z.string(),
    })
  ),
  instructions: z.array(
    z.object({
      stepNumber: z.number(),
      instruction: z.string(),
      missingDetails: z.string(),
      suggestedValue: z.string(),
      reasonForSuggestion: z.string(),
    })
  ),
  videoNotes: z.array(z.string()),
  missingDetailsSummary: z.array(z.string()),
  alternativeIngredients: z.array(
    z.object({
      originalIngredient: z.string(),
      alternativeIngredient: z.string(),
      replacementRatio: z.string(),
      whyItWorks: z.string(),
      flavorTextureImpact: z.string(),
      dietaryNote: z.string(),
    })
  ),
});

export type RecipeExtraction = z.infer<typeof recipeExtractionSchema>;

export const extractRecipeRequestSchema = z.object({
  videoUrl: z.string().min(1, 'videoUrl is required'),
  /** ISO 639-1 language code — used to fetch the correct caption track and guide extraction */
  language: z.enum(SUPPORTED_LANGUAGE_CODES).default(DEFAULT_LANGUAGE),
  /** Optional: paste transcript text for local testing without fetching from video */
  manualTranscript: z.string().optional(),
});
