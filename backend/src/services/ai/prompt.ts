import type { ExtractionInput } from './types';
import { getLanguageLabel } from '../../constants/languages';

/** System prompt sent to all AI providers */
export const EXTRACTION_SYSTEM_PROMPT = `You are an expert recipe extraction assistant. Extract what is present from the provided video transcript, captions, post caption, description, title, and metadata.

LANGUAGE: The user specifies the video language. Write ALL extracted recipe text (title, description, ingredient names, instructions, notes) in that language. Do NOT translate to another language unless the source is in another language.

INGREDIENTS: List each ingredient as a clean line — amount in extractedAmount, item name only in name (e.g. amount "1 lb", name "boneless chicken breasts"). Do NOT put prep notes, dice sizes, or "not indicated" inside the name field. Do not duplicate metric and imperial in both amount and unit fields — pick one. Do NOT put marination time or cook time in extractedAmount (e.g. never "1 hour" on soy sauce) — times belong in prepTime, cookTime, or instructions only.

COMPLETENESS: Extract EVERY ingredient explicitly listed in the source — including items under headings like "Marinade", "Sauce", "Glaze", "Dressing", or "For the chicken". Do not stop after the first few items. Facebook/Instagram captions often contain the full recipe in text form — parse all of them.

INSTRUCTIONS: Extract ONLY actionable cooking steps (roast, blend, marinate, cook, simmer, baste, serve, etc.). Each step's "instruction" field MUST be a full sentence describing what to do.

DO NOT put these in instructions:
- Creator dialog or reactions ("legit one of my fave", "easier for me to cook", etc.)
- Appliance or brand promos (air fryer ads, "check this out", "thanks to my Tefal...")
- Section headers ("Ingredients:", "Marinade:")
- Ingredient list lines ("4 small red bell peppers", "2 tsp paprika")
- Hashtags

Put promos and casual remarks in videoNotes if needed, not in instructions. Include bracketed cooking notes like "[simmer marinade with butter]" as steps. Parse lines with temperatures and times (e.g. "Roast at 180 deg for 40 mins").

INGREDIENT USAGE: For each ingredient set "usage" to exactly one of:
- "marination" — used only in a marinade or soaking step
- "cooking" — main cook/roast/fry ingredients (protein, vegetables, starch, etc.)
- "sauce" — dipping sauce, glaze, or reduced sauce (not the marinade)
- "garnish" — topping only
- "both" — used in marinade AND during cooking
- "not indicated" — when unclear

TITLE INGREDIENTS: If the recipe title names main components (e.g. "Chicken and Marble Potatoes") but the caption ingredient list omits them, you MUST still add those items under usage "cooking" with amount "not indicated" if no quantity is given.

TITLE: Use the actual DISH NAME, not the creator's hype or slang opening line.

Social media captions (especially Filipino Facebook/Instagram Reels) often start with slang or reactions like "Gagi!", "Grabe!", "pwede din pala!" — these are NOT recipe titles.

For recipeTitle:
- Use ONLY the dish name (2–8 words). Examples: "Chicken Liver", "Crispy Juicy Chicken Breast Patties", "Sushi Bake"
- Do NOT use engagement CTAs as the title: "Comment CHICKEN and I will dm you the full recipe" is NOT a dish name
- The dish name is usually the HEADLINE in the caption (e.g. "CRISPY & JUICY CHICKEN BREAST PATTIES"), NOT the comment/DM line
- Do NOT include: "Recipe", clickbait, Filipino hype, emojis, hashtags, "highly requested", "comment for", "dm me", or channel/page names
- Find the real dish in the caption headline before the comma or CTA (e.g. "HIGHLY REQUESTED CRISPY & JUICY CHICKEN BREAST PATTIES, my grandmas..." → "Crispy Juicy Chicken Breast Patties")

DESCRIPTION: Write a brief 1–2 sentence summary of the dish only. Do NOT copy sponsor text, appliance promos, hashtags, or "follow for more" lines into description.

MISSING VALUES: If an amount, unit, size, timing, temperature, serving count, or cooking detail is not included, write exactly 'not indicated' (always in English, even when the recipe is in another language).

SUGGESTIONS: Provide clearly separated smart suggestions with reasons based on common cooking standards. Do not mix extracted facts with suggestions.

FINAL REVIEW (ingredients): Before returning JSON, scan the ingredients list and fix:
- Remove duplicate entries (e.g. "salt & pepper" listed twice)
- Remove repeated words (e.g. "oil oil", "lemon juice lemon juice")
- Do not put the same text in both extractedAmount and name — use amount for quantity, name for the item only
- Each ingredient appears once with one clear line of text

Return valid JSON only using the required schema. JSON keys must stay in English; values use the user-selected language for recipe content.`;

const SCHEMA_TEMPLATE = `{
  "recipeTitle": "",
  "description": "",
  "sourceVideoUrl": "",
  "confidenceScore": "",
  "servings": { "extracted": "", "status": "", "suggested": "", "reason": "" },
  "prepTime": { "extracted": "", "status": "", "suggested": "", "reason": "" },
  "cookTime": { "extracted": "", "status": "", "suggested": "", "reason": "" },
  "totalTime": { "extracted": "", "status": "", "suggested": "", "reason": "" },
  "ingredients": [{ "name": "", "extractedAmount": "", "unitOrSize": "", "usage": "marination|cooking|sauce|garnish|both|not indicated", "status": "", "suggestedAmount": "", "reasonForSuggestion": "" }],
  "instructions": [{ "stepNumber": 1, "instruction": "", "missingDetails": "", "suggestedValue": "", "reasonForSuggestion": "" }],
  "videoNotes": [],
  "missingDetailsSummary": [],
  "alternativeIngredients": [{ "originalIngredient": "", "alternativeIngredient": "", "replacementRatio": "", "whyItWorks": "", "flavorTextureImpact": "", "dietaryNote": "" }]
}`;

/** Build the user message with video content for extraction */
export function buildExtractionUserPrompt(input: ExtractionInput): string {
  const languageLabel = getLanguageLabel(input.language);
  const hasSpokenTranscript = input.sources.includes('audio_transcription') || input.sources.includes('transcript');
  const hasPostCaption = input.sources.includes('caption') && input.transcript.includes('[Post caption]');

  let sourceNote = '';
  if (input.platform === 'facebook' && hasSpokenTranscript && hasPostCaption) {
    sourceNote =
      '\nFACEBOOK SOURCE: You have BOTH the post caption and a spoken audio transcript. Prefer ingredient amounts and cooking steps from the spoken transcript when they conflict with the caption. The caption may only be a CTA ("comment for recipe") — do not invent ingredients missing from both sections.\n';
  } else if (
    input.platform === 'facebook' ||
    input.metadata.sourceType === 'facebook_caption' ||
    (input.transcript.length > 0 && input.sources.includes('caption') && !hasSpokenTranscript)
  ) {
    sourceNote =
      '\nFACEBOOK/CAPTION SOURCE: The text below is the post caption — it may contain ALL ingredients AND cooking steps. Parse every bullet, subsection (Marinade, etc.), bracketed notes [like this], and lines with roast/cook times. The instructions array must list every step with full instruction text.\n';
  } else if (hasSpokenTranscript) {
    sourceNote =
      '\nSPOKEN TRANSCRIPT: The text below is what the creator said in the video. Extract ingredients and steps from their narration.\n';
  }

  return `Extract a recipe from this cooking video content.
${sourceNote}
Video URL: ${input.videoUrl}
Platform: ${input.platform}
User-selected video language: ${input.language} (${languageLabel})
Title: ${input.title || 'not indicated'}
Description: ${input.description || 'not indicated'}
Available sources: ${input.sources.join(', ') || 'none'}

Transcript / captions / post caption:
${input.transcript || 'not available'}

Metadata:
${JSON.stringify(input.metadata, null, 2)}

IMPORTANT: The user confirmed this video is in ${languageLabel}. Extract the recipe in ${languageLabel} only.
List ALL ingredients from the source with usage (marination, cooking, sauce, etc.). Do not omit ingredients from subsections like Marinade.
Extract ONLY real cooking steps in instructions — no dialog, promos, ingredient lines, or section headers.

Return JSON matching this exact schema:
${SCHEMA_TEMPLATE}

Set sourceVideoUrl to: ${input.videoUrl}
For confidenceScore, use "high", "medium", or "low" based on how complete the source text is.
For alternativeIngredients, suggest realistic substitutions where appropriate (in ${languageLabel} when possible).`;
}
