import type { RecipeExtraction } from '../schemas/recipe';
import {
  extractInstructionsFromCaption,
  extractInstructionText,
  isPlaceholderInstruction,
  isValidCookingStep,
} from './instructionExtract';

function toInstructionSteps(texts: string[]) {
  return texts.map((instruction, index) => ({
    stepNumber: index + 1,
    instruction,
    missingDetails: 'not indicated',
    suggestedValue: '',
    reasonForSuggestion: '',
  }));
}

/** Remove promos, dialog, ingredient lines; fill from caption if nothing valid remains */
export function sanitizeRecipeInstructions(
  recipe: RecipeExtraction,
  transcript: string
): RecipeExtraction {
  const valid = recipe.instructions.filter((i) => isValidCookingStep(i.instruction));

  if (valid.length > 0) {
    return {
      ...recipe,
      instructions: valid.map((step, index) => ({
        ...step,
        stepNumber: index + 1,
      })),
    };
  }

  const fromCaption = extractInstructionsFromCaption(transcript);
  if (fromCaption.length === 0) {
    return { ...recipe, instructions: [] };
  }

  return {
    ...recipe,
    instructions: toInstructionSteps(fromCaption),
  };
}

/** @deprecated use sanitizeRecipeInstructions */
export function fillMissingInstructions(
  recipe: RecipeExtraction,
  transcript: string
): RecipeExtraction {
  const allWeak =
    recipe.instructions.length === 0 ||
    recipe.instructions.every((i) => isPlaceholderInstruction(i.instruction));

  if (!allWeak) return sanitizeRecipeInstructions(recipe, transcript);

  return sanitizeRecipeInstructions(recipe, transcript);
}

/** Normalize a single instruction object from AI JSON */
export function normalizeInstructionItem(
  item: unknown,
  index: number
): {
  stepNumber: number;
  instruction: string;
  missingDetails: string;
  suggestedValue: string;
  reasonForSuggestion: string;
} {
  const stepNumber = index + 1;

  if (typeof item === 'string') {
    const instruction = item.trim();
    return {
      stepNumber,
      instruction: instruction || `Step ${stepNumber}`,
      missingDetails: 'not indicated',
      suggestedValue: '',
      reasonForSuggestion: '',
    };
  }

  const s = (item ?? {}) as Record<string, unknown>;
  const stepRaw = s.stepNumber ?? s.step ?? index + 1;
  const num =
    typeof stepRaw === 'number' ? stepRaw : parseInt(String(stepRaw), 10) || stepNumber;

  const instruction = extractInstructionText(s) || `Step ${num}`;

  return {
    stepNumber: num,
    instruction,
    missingDetails: String(s.missingDetails ?? 'not indicated'),
    suggestedValue: String(s.suggestedValue ?? ''),
    reasonForSuggestion: String(s.reasonForSuggestion ?? ''),
  };
}

/** Resolve instructions array — handles alternate top-level keys and string arrays */
export function normalizeInstructionsList(data: Record<string, unknown>): ReturnType<
  typeof normalizeInstructionItem
>[] {
  const raw =
    data.instructions ??
    data.steps ??
    data.directions ??
    data.method ??
    data.preparation ??
    [];

  if (!Array.isArray(raw)) return [];

  return raw.map((item, index) => normalizeInstructionItem(item, index));
}
