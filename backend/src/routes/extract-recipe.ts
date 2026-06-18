import { Router, type Request, type Response } from 'express';
import { extractRecipeRequestSchema } from '../schemas/recipe';
import { validateVideoUrl } from '../utils/urlValidation';
import { fetchVideoContent, buildExtractionTranscript } from '../services/videoContent';
import { extractRecipeWithAI } from '../services/ai';
import type { ExtractionInput } from '../services/ai/types';
import { sanitizeRecipeInstructions } from '../utils/fillInstructions';
import { fillTitleIngredients } from '../utils/ingredientEnrich';
import { sanitizeRecipeIngredients } from '../utils/sanitizeIngredients';
import { getThumbnailUrlForVideoAsync } from '../utils/thumbnails';
import type { SourceContent } from '../schemas/extractResponse';
import { sanitizeRecipeTitle } from '../utils/recipeTitle';
import { evaluateSourceQuality, TRANSCRIPTION_SETUP_HINT } from '../utils/sourceQuality';
import { buildCtaOnlyRecipe } from '../utils/ctaOnlyRecipe';

export const extractRecipeRouter = Router();

function normalizeSourceUrl(url: string): string {
  const trimmed = url.trim();
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
}

function buildSourceContent(
  input: ExtractionInput,
  thumbnailUrl?: string,
  postCaption?: string,
  sourceWarning?: string
): SourceContent {
  return {
    transcript: input.transcript,
    postCaption: postCaption || undefined,
    title: input.title,
    description: input.description,
    platform: input.platform,
    sources: input.sources,
    language: input.language,
    thumbnailUrl: thumbnailUrl || undefined,
    sourceWarning: sourceWarning || undefined,
  };
}

extractRecipeRouter.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = extractRecipeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error:
          'Invalid request body. Expected { "videoUrl": "string", "language"?: "en"|"es"|..., "manualTranscript"?: "string" }.',
        code: 'INVALID_REQUEST',
      });
    }

    const { videoUrl, manualTranscript, language } = parsed.data;
    const hasManualTranscript = Boolean(manualTranscript?.trim());

    let extractionInput: ExtractionInput;
    let thumbnailUrl = '';
    let spokenTranscript = '';
    let postCaption: string | undefined;

    if (hasManualTranscript) {
      const normalizedUrl = normalizeSourceUrl(videoUrl);
      thumbnailUrl = (await getThumbnailUrlForVideoAsync(normalizedUrl)) ?? '';
      spokenTranscript = manualTranscript!.trim();
      extractionInput = {
        videoUrl: normalizedUrl,
        platform: 'manual-test',
        title: 'Manual transcript (testing)',
        description: 'Recipe extracted from manually submitted transcript for local testing.',
        transcript: spokenTranscript,
        language,
        metadata: { mode: 'manualTranscript', captionLanguage: language },
        sources: ['manualTranscript'],
      };
    } else {
      const urlValidation = validateVideoUrl(videoUrl);
      if (!urlValidation.isValid || !urlValidation.normalizedUrl) {
        return res.status(400).json({
          error: urlValidation.error ?? 'Invalid video URL.',
          code: 'INVALID_URL',
        });
      }

      let videoContent;
      try {
        videoContent = await fetchVideoContent(urlValidation.normalizedUrl, language);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch video content.';
        const isContentError =
          message.includes('Captions') ||
          message.includes('transcript') ||
          message.includes('Not enough content') ||
          message.includes('Could not load this Facebook');

        return res.status(isContentError ? 422 : 400).json({
          error: message,
          code: isContentError ? 'CONTENT_UNAVAILABLE' : 'FETCH_ERROR',
        });
      }

      const hasSpokenTranscript = videoContent.transcript.trim().length > 0;
      const hasCaption = Boolean(videoContent.postCaption?.trim());
      const hasTranscript = hasSpokenTranscript || hasCaption;
      const hasTitle = videoContent.title.trim().length > 0;
      const hasDescription = videoContent.description.trim().length > 0;

      if (!hasTranscript && !hasTitle && !hasDescription) {
        return res.status(422).json({
          error:
            'Captions or transcript are unavailable for this video, and there is not enough description or metadata to extract a recipe. Tip: paste transcript text in manualTranscript for testing.',
          code: 'INSUFFICIENT_CONTENT',
        });
      }

      const combinedTranscript = buildExtractionTranscript(videoContent);
      spokenTranscript = videoContent.transcript;
      postCaption = videoContent.postCaption;

      extractionInput = {
        videoUrl: urlValidation.normalizedUrl,
        platform: videoContent.platform,
        title: videoContent.title,
        description: videoContent.description,
        transcript: combinedTranscript,
        language,
        metadata: videoContent.metadata,
        sources: videoContent.sources,
      };
      thumbnailUrl = videoContent.thumbnailUrl;

      const sourceQuality = evaluateSourceQuality({
        platform: videoContent.platform,
        transcript: videoContent.transcript,
        postCaption: videoContent.postCaption,
        sources: videoContent.sources,
      });

      if (sourceQuality.level === 'cta_only') {
        const recipeTitle = sanitizeRecipeTitle(
          videoContent.title,
          postCaption ?? combinedTranscript,
          '',
          videoContent.title
        );

        const recipe = buildCtaOnlyRecipe(
          urlValidation.normalizedUrl,
          recipeTitle,
          TRANSCRIPTION_SETUP_HINT
        );

        const warning =
          'Caption only — no recipe text in post. Install yt-dlp + ffmpeg and configure Whisper for spoken transcript.';

        return res.json({
          recipe,
          sourceContent: buildSourceContent(
            { ...extractionInput, transcript: spokenTranscript },
            thumbnailUrl,
            postCaption,
            warning
          ),
        });
      }
    }

    const recipe = sanitizeRecipeIngredients(
      fillTitleIngredients(
        sanitizeRecipeInstructions(await extractRecipeWithAI(extractionInput), extractionInput.transcript)
      )
    );

    recipe.recipeTitle = sanitizeRecipeTitle(
      recipe.recipeTitle,
      extractionInput.transcript || extractionInput.description,
      recipe.description,
      extractionInput.title
    );

    if (
      extractionInput.platform === 'facebook' &&
      !extractionInput.sources.includes('audio_transcription') &&
      !extractionInput.sources.includes('transcript')
    ) {
      recipe.confidenceScore = 'low';
    }

    return res.json({
      recipe,
      sourceContent: buildSourceContent(
        { ...extractionInput, transcript: spokenTranscript },
        thumbnailUrl,
        postCaption
      ),
    });
  } catch (error) {
    console.error('[extract-recipe] Error:', error);
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred during extraction.';
    return res.status(500).json({
      error: message,
      code: 'EXTRACTION_ERROR',
    });
  }
});
