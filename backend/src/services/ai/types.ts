import type { RecipeExtraction } from '../../schemas/recipe';

/** Supported AI providers — switch via AI_PROVIDER in backend/.env */
export type AiProviderName = 'ollama-local' | 'mock' | 'openai' | 'gemini';

/** Content passed to the AI for recipe extraction */
export interface ExtractionInput {
  videoUrl: string;
  platform: string;
  title: string;
  description: string;
  transcript: string;
  /** ISO 639-1 language selected by the user */
  language: string;
  metadata: Record<string, string>;
  sources: string[];
}

/** Every provider must implement this interface */
export interface AiProvider {
  name: AiProviderName;
  extractRecipe(input: ExtractionInput): Promise<RecipeExtraction>;
}
