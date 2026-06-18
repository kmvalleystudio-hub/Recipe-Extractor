import { readFile, rm } from 'fs/promises';
import { downloadVideoAudio } from './audioDownload';

export interface TranscriptionResult {
  text: string;
  source: 'audio_transcription';
}

type TranscriptionProvider = 'openai' | 'whisper-api';

function isTranscriptionEnabled(platform: string): boolean {
  const flag = process.env.AUDIO_TRANSCRIPTION_ENABLED?.toLowerCase();
  if (flag === 'false') return false;
  // Facebook reels rarely include full recipes in captions — always try audio when allowed
  if (platform === 'facebook') return true;
  return flag === 'true';
}

function resolveProvider(): TranscriptionProvider | null {
  const configured = (process.env.TRANSCRIPTION_PROVIDER ?? 'auto').toLowerCase();

  if (configured === 'openai') {
    return process.env.OPENAI_API_KEY?.trim() ? 'openai' : null;
  }

  if (configured === 'whisper-api') {
    return process.env.WHISPER_API_URL?.trim() ? 'whisper-api' : null;
  }

  // auto: prefer OpenAI when key is set, else local Whisper-compatible server
  if (process.env.OPENAI_API_KEY?.trim()) return 'openai';
  if (process.env.WHISPER_API_URL?.trim()) return 'whisper-api';

  // Default local faster-whisper / speaches endpoint
  return 'whisper-api';
}

async function transcribeWithOpenAI(
  audioPath: string,
  language: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const model = process.env.WHISPER_MODEL?.trim() || 'whisper-1';
  const audioBytes = await readFile(audioPath);
  const form = new FormData();
  form.append('file', new Blob([audioBytes]), 'audio.mp3');
  form.append('model', model);
  if (language) form.append('language', language.split('-')[0]);

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI transcription failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as { text?: string };
  return data.text?.trim() ?? '';
}

async function transcribeWithWhisperApi(
  audioPath: string,
  language: string
): Promise<string> {
  const baseUrl = (process.env.WHISPER_API_URL ?? 'http://localhost:8000/v1').replace(/\/$/, '');
  const model = process.env.WHISPER_MODEL?.trim() || 'whisper-1';
  const audioBytes = await readFile(audioPath);

  const form = new FormData();
  form.append('file', new Blob([audioBytes]), 'audio.mp3');
  form.append('model', model);
  if (language) form.append('language', language.split('-')[0]);

  const response = await fetch(`${baseUrl}/audio/transcriptions`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Local Whisper API failed (${response.status}) at ${baseUrl}: ${body.slice(0, 300)}`
    );
  }

  const data = (await response.json()) as { text?: string };
  return data.text?.trim() ?? '';
}

async function transcribeAudioFile(
  audioPath: string,
  language: string,
  provider: TranscriptionProvider
): Promise<string> {
  if (provider === 'openai') {
    return transcribeWithOpenAI(audioPath, language);
  }
  return transcribeWithWhisperApi(audioPath, language);
}

/**
 * Download video audio and transcribe spoken words.
 * Used for Facebook reels (no captions API) and YouTube when captions are unavailable.
 */
export async function transcribeVideoAudio(
  videoUrl: string,
  platform: string,
  language = 'en'
): Promise<TranscriptionResult | null> {
  if (!isTranscriptionEnabled(platform)) {
    return null;
  }

  const provider = resolveProvider();
  if (!provider) {
    console.log(
      '[audioTranscription] No transcription provider configured. Set OPENAI_API_KEY or WHISPER_API_URL.'
    );
    return null;
  }

  let tempDir: string | undefined;

  try {
    console.log(`[audioTranscription] Downloading audio (${platform})…`);
    const download = await downloadVideoAudio(videoUrl);
    tempDir = download.tempDir;

    console.log(`[audioTranscription] Transcribing with ${provider}…`);
    const text = await transcribeAudioFile(download.audioPath, language, provider);

    if (!text) {
      console.log('[audioTranscription] Transcription returned empty text.');
      return null;
    }

    console.log(`[audioTranscription] Done — ${text.split(/\s+/).filter(Boolean).length} words.`);
    return { text, source: 'audio_transcription' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[audioTranscription] Failed:', message);
    return null;
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
