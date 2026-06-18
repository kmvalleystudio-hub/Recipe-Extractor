import type { AiProvider, AiProviderName, ExtractionInput } from './types';
import { OllamaProvider } from './providers/ollama';
import { MockProvider } from './providers/mock';
import { OpenAiProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import type { RecipeExtraction } from '../../schemas/recipe';

/** Read the active provider name from environment (defaults to ollama-local) */
export function getAiProviderName(): AiProviderName {
  const provider = process.env.AI_PROVIDER ?? 'ollama-local';
  const valid: AiProviderName[] = ['ollama-local', 'mock', 'openai', 'gemini'];
  if (!valid.includes(provider as AiProviderName)) {
    console.warn(`[ai] Unknown AI_PROVIDER "${provider}", falling back to ollama-local`);
    return 'ollama-local';
  }
  return provider as AiProviderName;
}

/** Create the AI provider instance based on AI_PROVIDER env var */
export function createAiProvider(): AiProvider {
  const name = getAiProviderName();

  switch (name) {
    case 'mock':
      return new MockProvider();
    case 'openai':
      return new OpenAiProvider();
    case 'gemini':
      return new GeminiProvider();
    case 'ollama-local':
    default:
      return new OllamaProvider();
  }
}

/** Extract a recipe using the configured AI provider */
export async function extractRecipeWithAI(input: ExtractionInput): Promise<RecipeExtraction> {
  const provider = createAiProvider();
  console.log(`[ai] Extracting recipe with provider: ${provider.name}`);
  return provider.extractRecipe(input);
}
