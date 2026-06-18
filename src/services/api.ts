import Constants from 'expo-constants';
import type { ApiError, ExtractRecipeResponse } from '@/types/recipe';
import { validateExtractResponse } from '@/utils/recipeValidation';

/**
 * Backend API base URL — set EXPO_PUBLIC_API_URL in .env.
 *
 * IMPORTANT for local development:
 * - The mobile app talks to YOUR BACKEND only (never Ollama directly).
 * - On a physical Android phone or emulator, "localhost" means the device itself,
 *   NOT your computer. Use your computer's LAN IP instead, e.g.:
 *   EXPO_PUBLIC_API_URL=http://192.168.1.10:3001
 * - Find your IP: Windows → ipconfig, look for IPv4 Address.
 * - The backend then calls Ollama at localhost:11434 on your computer.
 */
function getApiBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_API_URL ??
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
    'http://localhost:3001'
  );
}

export class ExtractRecipeError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ExtractRecipeError';
    this.code = code;
  }
}

export interface ExtractRecipeOptions {
  videoUrl: string;
  /** ISO 639-1 language code for caption fetch and extraction */
  language: string;
  /** Optional: paste transcript text for local testing (sent to backend only) */
  manualTranscript?: string;
}

/** Send video URL (and optional manual transcript) to backend for recipe extraction */
export async function extractRecipe({
  videoUrl,
  language,
  manualTranscript,
}: ExtractRecipeOptions): Promise<ExtractRecipeResponse> {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/api/extract-recipe`;

  const body: { videoUrl: string; language: string; manualTranscript?: string } = {
    videoUrl,
    language,
  };
  if (manualTranscript?.trim()) {
    body.manualTranscript = manualTranscript.trim();
  }

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ExtractRecipeError(
      'Could not reach the server. On a phone or emulator, set EXPO_PUBLIC_API_URL to your computer\'s IP (not localhost).',
      'NETWORK_ERROR'
    );
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = data as ApiError | null;
    throw new ExtractRecipeError(
      error?.error ?? 'Recipe extraction failed. Please try again.',
      error?.code
    );
  }

  if (!validateExtractResponse(data)) {
    console.warn('[api] Invalid extract response:', JSON.stringify(data).slice(0, 500));
    throw new ExtractRecipeError(
      'Received an invalid response from the server. Try again, or use AI_PROVIDER=mock on the backend to test the UI.',
      'INVALID_RESPONSE'
    );
  }

  return data;
}
