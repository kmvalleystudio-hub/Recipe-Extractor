import type { AiProvider, ExtractionInput } from '../types';
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from '../prompt';
import { parseJsonFromModelOutput, validateRecipeJson } from '../parseResponse';

/**
 * Ollama local provider — calls Ollama running on your machine.
 * Default: http://localhost:11434 (configured via OLLAMA_BASE_URL in backend/.env)
 */
export class OllamaProvider implements AiProvider {
  name = 'ollama-local' as const;

  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/$/, '');
    this.model = process.env.OLLAMA_MODEL ?? 'llama3.2';
  }

  async extractRecipe(input: ExtractionInput) {
    const endpoint = `${this.baseUrl}/api/chat`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
            { role: 'user', content: buildExtractionUserPrompt(input) },
          ],
          stream: false,
          format: 'json',
        }),
      });
    } catch (error) {
      console.error('[ollama] Connection failed:', error);
      throw new Error(
        `Could not connect to Ollama at ${this.baseUrl}. Make sure Ollama is running (ollama serve) and the model "${this.model}" is pulled (ollama pull ${this.model}).`
      );
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[ollama] API error:', response.status, errorBody);
      throw new Error(
        `Ollama returned an error (${response.status}). Check that model "${this.model}" is installed: ollama pull ${this.model}`
      );
    }

    const data = (await response.json()) as {
      message?: { content?: string };
    };

    const rawContent = data.message?.content;
    if (!rawContent) {
      throw new Error('Ollama returned an empty response. Try again or use AI_PROVIDER=mock for UI testing.');
    }

    let parsed: unknown;
    try {
      parsed = parseJsonFromModelOutput(rawContent);
    } catch {
      console.error('[ollama] Invalid JSON in response:', rawContent.slice(0, 500));
      throw new Error(
        'Ollama returned invalid JSON. The model may need a retry — try again or use a different OLLAMA_MODEL.'
      );
    }

    return validateRecipeJson(parsed, 'ollama', input.videoUrl);
  }
}
