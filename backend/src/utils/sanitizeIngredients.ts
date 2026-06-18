import type { RecipeExtraction } from '../schemas/recipe';
import { normalizeIngredientUsage } from './ingredientUsage';
import {
  dedupeIngredientLine,
  mergeAmountParts,
  stripDuplicateLeadingAmount,
  stripNotIndicatedMarkers,
  measuresEquivalent,
  isTimeDurationPhrase,
  stripLeadingTimeDuration,
  fixCommonIngredientTypos,
  normalizeIngredientText,
  stripBulletPrefix,
  splitCombinedIngredientText,
  splitAmountAndName,
} from './ingredientDedupe';

type Ingredient = RecipeExtraction['ingredients'][number];

function isNotIndicated(value: string): boolean {
  return value.trim().toLowerCase() === 'not indicated';
}

function removeConsecutiveDuplicateWords(text: string): string {
  const words = text.trim().split(/\s+/);
  const out: string[] = [];
  for (const word of words) {
    const prev = out[out.length - 1];
    if (prev && prev.toLowerCase() === word.toLowerCase()) continue;
    out.push(word);
  }
  return out.join(' ');
}

function removeTrailingRedundantPhrase(text: string): string {
  const words = text.trim().split(/\s+/);
  if (words.length < 3) return text;

  for (let suffixLen = Math.min(4, Math.floor(words.length / 2)); suffixLen >= 1; suffixLen--) {
    const suffix = words.slice(-suffixLen).join(' ').toLowerCase();
    const prefix = words.slice(0, -suffixLen).join(' ').toLowerCase();
    if (prefix.includes(suffix)) {
      return words.slice(0, -suffixLen).join(' ');
    }
  }
  return text;
}

function cleanField(text: string): string {
  return removeTrailingRedundantPhrase(removeConsecutiveDuplicateWords(stripBulletPrefix(text.trim())));
}

function reconcileNameAndAmount(name: string, amount: string): { name: string; amount: string } {
  const split = splitAmountAndName(amount, name);
  let n = cleanField(normalizeIngredientText(split.name));
  let a = cleanField(normalizeIngredientText(split.amount));

  if (!a) return { name: n, amount: '' };
  if (!n) return { name: '', amount: a };

  n = stripDuplicateLeadingAmount(a, n);

  const nLow = n.toLowerCase();
  const aLow = a.toLowerCase();

  if (measuresEquivalent(a, n) || aLow === nLow || aLow.includes(nLow)) {
    return { name: '', amount: a };
  }

  if (nLow.endsWith(aLow) && nLow.length > aLow.length) {
    n = n.slice(0, n.length - a.length).trim();
  }

  const nameWords = nLow.split(/\s+/).filter(Boolean);
  if (nameWords.length > 0 && nameWords.every((w) => aLow.includes(w))) {
    return { name: '', amount: a };
  }

  return { name: n, amount: a };
}

function formatLine(name: string, amount: string): string {
  const { name: n, amount: a } = reconcileNameAndAmount(name, amount);
  if (!a) return dedupeIngredientLine(n);
  if (!n) return dedupeIngredientLine(a);
  if (a.toLowerCase().includes(n.toLowerCase())) return dedupeIngredientLine(a);
  return dedupeIngredientLine(`${a} ${n}`);
}

function normalizeIngredientKey(line: string, usage: string): string {
  return `${usage}:${line}`
    .toLowerCase()
    .replace(/[&,]/g, ' and ')
    .replace(/\s+/g, ' ')
    .replace(/optional/g, '')
    .trim();
}

function sanitizeOneIngredient(ingredient: Ingredient): Ingredient {
  let cleanedName = normalizeIngredientText(cleanField(ingredient.name));
  let mergedAmount = mergeAmountParts(ingredient.extractedAmount, ingredient.unitOrSize);
  mergedAmount = stripLeadingTimeDuration(stripBulletPrefix(stripNotIndicatedMarkers(mergedAmount)));

  if (isTimeDurationPhrase(mergedAmount)) {
    mergedAmount = '';
  }

  const { name, amount } = reconcileNameAndAmount(cleanedName, mergedAmount);
  cleanedName = fixCommonIngredientTypos(name || cleanedName);

  const hasAmount =
    mergedAmount.length > 0 && !isNotIndicated(mergedAmount) && !isTimeDurationPhrase(amount);

  return {
    ...ingredient,
    name: cleanedName,
    extractedAmount: hasAmount ? amount || mergedAmount : 'not indicated',
    unitOrSize: 'not indicated',
  };
}

/** Split one AI row that merged multiple comma-separated bullet ingredients */
function expandCombinedIngredients(ingredient: Ingredient): Ingredient[] {
  const combined = `${ingredient.extractedAmount} ${ingredient.name}`.trim();
  const chunks = splitCombinedIngredientText(combined);

  if (chunks.length <= 1) {
    return [sanitizeOneIngredient(ingredient)];
  }

  return chunks.map((chunk) => {
    const { amount, name } = splitAmountAndName('', chunk);
    return sanitizeOneIngredient({
      ...ingredient,
      name: name || chunk,
      extractedAmount: amount || 'not indicated',
      unitOrSize: 'not indicated',
    });
  });
}

function deduplicateIngredients(ingredients: Ingredient[]): Ingredient[] {
  const seen = new Set<string>();
  const result: Ingredient[] = [];

  for (const ing of ingredients) {
    const usage = normalizeIngredientUsage(ing.usage);
    const line = formatLine(ing.name, mergeAmountParts(ing.extractedAmount, ing.unitOrSize));
    const key = normalizeIngredientKey(line, usage);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push({ ...ing, usage });
  }

  return result;
}

export function sanitizeRecipeIngredients(recipe: RecipeExtraction): RecipeExtraction {
  const expanded = recipe.ingredients.flatMap(expandCombinedIngredients);
  const cleaned = expanded.filter(
    (i) => i.name.trim().length > 0 || !isNotIndicated(i.extractedAmount)
  );

  const deduped = deduplicateIngredients(cleaned);

  return {
    ...recipe,
    ingredients: deduped.map((ing) => ({
      ...ing,
      usage: normalizeIngredientUsage(ing.usage),
    })),
  };
}
