import { z } from 'zod';
import { recipeExtractionSchema } from './recipe';

/** Raw text fetched from the video before AI processing */
export const sourceContentSchema = z.object({
  /** Spoken words — YouTube captions or audio transcription */
  transcript: z.string(),
  /** Facebook/Instagram post caption when separate from spoken audio */
  postCaption: z.string().optional(),
  title: z.string(),
  description: z.string(),
  platform: z.string(),
  sources: z.array(z.string()),
  language: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  sourceWarning: z.string().optional(),
});

export type SourceContent = z.infer<typeof sourceContentSchema>;

/** Full API response: structured recipe + original source text for review */
export const extractRecipeResponseSchema = z.object({
  recipe: recipeExtractionSchema,
  sourceContent: sourceContentSchema,
});

export type ExtractRecipeResponse = z.infer<typeof extractRecipeResponseSchema>;
