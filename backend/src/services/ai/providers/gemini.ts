import type { AiProvider, ExtractionInput } from '../types';
import type { RecipeExtraction } from '../../../schemas/recipe';

/**
 * Gemini provider — placeholder for future Google Gemini integration.
 * Set AI_PROVIDER=gemini and GEMINI_API_KEY in backend/.env when ready.
 */
export class GeminiProvider implements AiProvider {
  name = 'gemini' as const;

  async extractRecipe(_input: ExtractionInput): Promise<RecipeExtraction> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured. Add it to backend/.env or switch to AI_PROVIDER=ollama-local.'
      );
    }

    // Placeholder — implement when Gemini API key is available
    throw new Error(
      'Gemini provider is not implemented yet. Use AI_PROVIDER=ollama-local or AI_PROVIDER=mock for now.'
    );
  }
}
