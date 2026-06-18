import type { Ingredient } from '@/types/recipe';
import { isNotIndicated } from '@/utils/recipeValidation';
import {
  dedupeIngredientLine,
  mergeAmountParts,
  stripDuplicateLeadingAmount,
  stripNotIndicatedMarkers,
  isTimeDurationPhrase,
  stripLeadingTimeDuration,
  fixCommonIngredientTypos,
  normalizeIngredientText,
  stripBulletPrefix,
  splitAmountAndName,
} from '@/utils/ingredientDedupe';

export const MISSING_AMOUNT = '—';

export { stripNotIndicatedMarkers } from '@/utils/ingredientDedupe';

/**
 * Standard cooking unit abbreviations (US/common recipe style).
 * Cup is spelled out — there is no universal single-letter shorthand like tbsp/tsp.
 */
const UNIT_REPLACEMENTS: [RegExp, string][] = [
  [/\btablespoons?\b/gi, 'tbsp'],
  [/\bteaspoons?\b/gi, 'tsp'],
  [/\bfluid\s+ounces?\b/gi, 'fl oz'],
  [/\bounces?\b/gi, 'oz'],
  [/\bpounds?\b/gi, 'lb'],
  [/\bgrams?\b/gi, 'g'],
  [/\bkilograms?\b/gi, 'kg'],
  [/\bmilliliters?\b/gi, 'ml'],
  [/\bcentiliters?\b/gi, 'cl'],
  [/\bliters?\b/gi, 'L'],
];

function normalizeCupUnits(text: string): string {
  return text.replace(/\b(\d+(?:\.\d+)?)\s+c\b(?!\w)/gi, (_, num) => {
    const n = parseFloat(num);
    return `${num} ${n === 1 ? 'cup' : 'cups'}`;
  });
}

export function abbreviateCookingUnits(text: string): string {
  let result = normalizeCupUnits(text.trim());
  for (const [pattern, abbrev] of UNIT_REPLACEMENTS) {
    result = result.replace(pattern, abbrev);
  }
  return result.replace(/\s+/g, ' ').trim();
}

export function mergeAmountAndUnit(amount: string, unit: string): string {
  if (isNotIndicated(amount.trim()) && isNotIndicated(unit.trim())) return '';
  if (isNotIndicated(amount.trim())) return stripNotIndicatedMarkers(unit);
  if (isNotIndicated(unit.trim())) return stripNotIndicatedMarkers(amount);
  return mergeAmountParts(amount, unit);
}

export function cleanIngredientName(name: string): string {
  return normalizeIngredientText(name.trim().replace(/\s+/g, ' '));
}

export function formatIngredientAmount(ingredient: Ingredient): string {
  const merged = mergeAmountAndUnit(ingredient.extractedAmount, ingredient.unitOrSize);
  const cleaned = stripLeadingTimeDuration(stripNotIndicatedMarkers(merged));
  if (!cleaned || isTimeDurationPhrase(cleaned)) return MISSING_AMOUNT;
  return abbreviateCookingUnits(cleaned);
}

export function formatIngredientLine(ingredient: Ingredient): string {
  const rawAmount = mergeAmountAndUnit(ingredient.extractedAmount, ingredient.unitOrSize);
  let amount = rawAmount
    ? abbreviateCookingUnits(stripLeadingTimeDuration(stripBulletPrefix(rawAmount)))
    : MISSING_AMOUNT;
  if (amount !== MISSING_AMOUNT && isTimeDurationPhrase(amount)) {
    amount = MISSING_AMOUNT;
  }

  const split = splitAmountAndName(
    amount === MISSING_AMOUNT ? '' : amount,
    cleanIngredientName(ingredient.name)
  );
  let name = fixCommonIngredientTypos(split.name);
  let qty = split.amount ? abbreviateCookingUnits(split.amount) : MISSING_AMOUNT;

  if (qty !== MISSING_AMOUNT) {
    name = stripDuplicateLeadingAmount(qty, name);
  }

  if (qty === MISSING_AMOUNT) return dedupeIngredientLine(name);

  const amountLower = qty.toLowerCase();
  const nameLower = name.toLowerCase();
  if (nameLower && amountLower.includes(nameLower)) return dedupeIngredientLine(qty);
  if (nameLower && nameLower.split(/\s+/).every((w) => amountLower.includes(w))) {
    return dedupeIngredientLine(qty);
  }

  if (!name) return dedupeIngredientLine(qty);

  return dedupeIngredientLine(`${qty} ${name}`);
}

/** Turn AI array items (string or object) into readable bullet text */
export function formatDetailText(item: unknown): string {
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
    const orderedKeys = [
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
    for (const key of orderedKeys) {
      const val = o[key];
      if (typeof val === 'string' && val.trim()) {
        parts.push(val.trim());
      }
    }

    if (parts.length > 0) {
      return [...new Set(parts)].join(' — ');
    }

    const fallback = Object.values(o)
      .filter((v) => typeof v === 'string' && v.trim())
      .map((v) => (v as string).trim());

    if (fallback.length > 0) {
      return fallback.join(' — ');
    }
  }

  const asString = String(item).trim();
  return asString === '[object Object]' ? '' : asString;
}

export function formatDetailList(items: unknown[]): string[] {
  return items.map(formatDetailText).filter((text) => text.length > 0);
}
