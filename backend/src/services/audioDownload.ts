import { mkdtemp, readdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { runCommand } from '../utils/runCommand';

const AUDIO_EXTENSIONS = new Set(['.mp3', '.m4a', '.wav', '.webm', '.ogg', '.opus', '.aac']);

/** Commands to try when locating yt-dlp on PATH (Windows + Unix) */
const YT_DLP_CANDIDATES = ['yt-dlp', 'yt-dlp.exe'];

let cachedYtDlp: string | null | undefined;

export async function findYtDlp(): Promise<string | null> {
  if (cachedYtDlp !== undefined) return cachedYtDlp;

  for (const candidate of YT_DLP_CANDIDATES) {
    try {
      await runCommand(candidate, ['--version'], { timeoutMs: 10_000 });
      cachedYtDlp = candidate;
      return candidate;
    } catch {
      // try next candidate
    }
  }

  cachedYtDlp = null;
  return null;
}

/**
 * Download audio from a public video URL into a temp directory.
 * Returns the path to the audio file. Caller must delete the parent directory.
 */
export async function downloadVideoAudio(videoUrl: string): Promise<{ audioPath: string; tempDir: string }> {
  const ytDlp = await findYtDlp();
  if (!ytDlp) {
    throw new Error(
      'yt-dlp is not installed or not on PATH. Install from https://github.com/yt-dlp/yt-dlp#installation ' +
        '(ffmpeg is also required for audio extraction).'
    );
  }

  const tempDir = await mkdtemp(join(tmpdir(), 'recipe-audio-'));
  const outputTemplate = join(tempDir, 'audio.%(ext)s');

  const extraArgs = process.env.YT_DLP_EXTRA_ARGS?.trim().split(/\s+/).filter(Boolean) ?? [];

  const args = [
    '-x',
    '--audio-format',
    'mp3',
    '--audio-quality',
    '5',
    '--no-playlist',
    '--no-warnings',
    '-o',
    outputTemplate,
    ...extraArgs,
    videoUrl,
  ];

  try {
    await runCommand(ytDlp, args, { timeoutMs: 180_000 });
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true });
    throw error;
  }

  const files = await readdir(tempDir);
  const audioFile = files.find((file) => AUDIO_EXTENSIONS.has(file.slice(file.lastIndexOf('.')).toLowerCase()));

  if (!audioFile) {
    await rm(tempDir, { recursive: true, force: true });
    throw new Error('yt-dlp did not produce an audio file for this URL.');
  }

  return { audioPath: join(tempDir, audioFile), tempDir };
}
