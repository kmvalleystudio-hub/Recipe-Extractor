import type { AiProvider, ExtractionInput } from '../types';
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from '../prompt';
import { parseJsonFromModelOutput, validateRecipeJson } from '../parseResponse';

/**
 * OpenAI provider — placeholder for future cloud AI integration.
 * Set AI_PROVIDER=openai and OPENAI_API_KEY in backend/.env when ready.
 */
export class OpenAiProvider implements AiProvider {
  name = 'openai' as const;

  async extractRecipe(input: ExtractionInput) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is not configured. Add it to backend/.env or switch to AI_PROVIDER=ollama-local.'
      );
    }

    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: buildExtractionUserPrompt(input) },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[openai] API error:', response.status, errorBody);
      throw new Error('OpenAI recipe extraction service is temporarily unavailable.');
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('No response from OpenAI.');
    }

    let parsed: unknown;
    try {
      parsed = parseJsonFromModelOutput(rawContent);
    } catch {
      throw new Error('OpenAI returned invalid JSON.');
    }

    return validateRecipeJson(parsed, 'openai', input.videoUrl);
  }
}
