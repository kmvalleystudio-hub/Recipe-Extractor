/** Coerce Ollama/AI output into shapes that match our recipe schema */
/** Coerce unknown array items (string or object) into display strings */
export function normalizeTextItem(item: unknown): string {
  if (item == null) return '';
  if (typeof item === 'string') {
    const trimmed = item.trim();
    return trimmed === '[object Object]' ? '' : trimmed;
  }
  if (typeof item === 'number' || typeof item === 'boolean') {
    return String(item);
  }
  if (typeof item === 'object') {
    const o = item as Record<string, unknown>;
    const keys = [
      'detail',
      'missingDetail',
      'field',
      'item',
      'description',
      'text',
      'summary',
      'suggestion',
      'suggested',
      'suggestedValue',
      'reason',
    ];
    const parts: string[] = [];
    for (const key of keys) {
      const val = o[key];
      if (typeof val === 'string' && val.trim()) parts.push(val.trim());
    }
    if (parts.length > 0) return [...new Set(parts)].join(' — ');
    const fallback = Object.values(o)
      .filter((v) => typeof v === 'string' && (v as string).trim())
      .map((v) => (v as string).trim());
    if (fallback.length > 0) return fallback.join(' — ');
  }
  const asString = String(item).trim();
  return asString === '[object Object]' ? '' : asString;
}

import { normalizeIngredientUsage } from './ingredientUsage';
import { normalizeInstructionsList } from './fillInstructions';

function mergeIngredientAmountFields(amount: string, unit: string): { amount: string; unit: string } {
  const a = amount.trim();
  const u = unit.trim();
  const amountMissing = !a || a.toLowerCase() === 'not indicated';
  const unitMissing = !u || u.toLowerCase() === 'not indicated';

  if (amountMissing && unitMissing) {
    return { amount: 'not indicated', unit: 'not indicated' };
  }
  if (amountMissing) return { amount: u, unit: 'not indicated' };
  if (unitMissing) return { amount: a, unit: 'not indicated' };

  const aLower = a.toLowerCase();
  const uLower = u.toLowerCase();
  if (aLower === uLower || aLower.includes(uLower)) {
    return { amount: a, unit: 'not indicated' };
  }
  if (uLower.includes(aLower)) {
    return { amount: u, unit: 'not indicated' };
  }
  return { amount: a, unit: u };
}

export function normalizeExtractedField(value: unknown): {
  extracted: string;
  status: string;
  suggested: string;
  reason: string;
} {
  if (!value || typeof value !== 'object') {
    return { extracted: 'not indicated', status: 'Unknown', suggested: '', reason: '' };
  }
  const f = value as Record<string, unknown>;
  const extracted = String(f.extracted ?? 'not indicated').trim();
  const status = String(f.status ?? 'Unknown').trim();
  return {
    extracted: extracted || 'not indicated',
    status: status || 'Unknown',
    suggested: String(f.suggested ?? ''),
    reason: String(f.reason ?? ''),
  };
}

export function normalizeRecipePayload(raw: unknown, videoUrl: string): unknown {
  if (!raw || typeof raw !== 'object') return raw;

  const data = raw as Record<string, unknown>;

  const ingredients = Array.isArray(data.ingredients)
    ? data.ingredients.map((item) => {
        const i = (item ?? {}) as Record<string, unknown>;
        const rawAmount = String(i.extractedAmount ?? 'not indicated').trim() || 'not indicated';
        const rawUnit = String(i.unitOrSize ?? 'not indicated').trim() || 'not indicated';
        const merged = mergeIngredientAmountFields(rawAmount, rawUnit);
        return {
          name: String(i.name ?? 'Unknown ingredient'),
          extractedAmount: merged.amount,
          unitOrSize: merged.unit,
          usage: normalizeIngredientUsage(i.usage),
          status: String(i.status ?? 'Unknown').trim() || 'Unknown',
          suggestedAmount: String(i.suggestedAmount ?? ''),
          reasonForSuggestion: String(i.reasonForSuggestion ?? ''),
        };
      })
    : [];

  const instructions = normalizeInstructionsList(data);

  const alternatives = Array.isArray(data.alternativeIngredients)
    ? data.alternativeIngredients.map((item) => {
        const a = (item ?? {}) as Record<string, unknown>;
        return {
          originalIngredient: String(a.originalIngredient ?? ''),
          alternativeIngredient: String(a.alternativeIngredient ?? ''),
          replacementRatio: String(a.replacementRatio ?? ''),
          whyItWorks: String(a.whyItWorks ?? ''),
          flavorTextureImpact: String(a.flavorTextureImpact ?? ''),
          dietaryNote: String(a.dietaryNote ?? ''),
        };
      })
    : [];

  return {
    recipeTitle: String(data.recipeTitle ?? 'Extracted Recipe').trim() || 'Extracted Recipe',
    description: String(data.description ?? ''),
    sourceVideoUrl: String(data.sourceVideoUrl ?? videoUrl),
    confidenceScore: String(data.confidenceScore ?? 'medium'),
    servings: normalizeExtractedField(data.servings),
    prepTime: normalizeExtractedField(data.prepTime),
    cookTime: normalizeExtractedField(data.cookTime),
    totalTime: normalizeExtractedField(data.totalTime),
    ingredients,
    instructions,
    videoNotes: Array.isArray(data.videoNotes)
      ? data.videoNotes.map(normalizeTextItem).filter((n) => n.length > 0)
      : [],
    missingDetailsSummary: Array.isArray(data.missingDetailsSummary)
      ? data.missingDetailsSummary.map(normalizeTextItem).filter((n) => n.length > 0)
      : [],
    alternativeIngredients: alternatives,
  };
}
