import type { Ingredient } from '@/types/recipe';

export type IngredientUsage =
  | 'marination'
  | 'cooking'
  | 'sauce'
  | 'garnish'
  | 'both'
  | 'not indicated';

const USAGE_LABELS: Record<Exclude<IngredientUsage, 'not indicated'>, string> = {
  marination: 'Marination',
  cooking: 'Cooking',
  sauce: 'Sauce',
  garnish: 'Garnish',
  both: 'Marination & cooking',
};

/** Normalize AI usage text to a standard value */
export function normalizeIngredientUsage(raw: unknown): IngredientUsage {
  const s = String(raw ?? 'not indicated').trim().toLowerCase();
  if (!s || s === 'not indicated' || s === 'unknown' || s === 'n/a') return 'not indicated';
  if (s.includes('marin') && s.includes('cook')) return 'both';
  if (s.includes('marin')) return 'marination';
  if (s.includes('sauce') || s.includes('dip') || s.includes('glaze')) return 'sauce';
  if (s.includes('garnish')) return 'garnish';
  if (s.includes('cook') || s.includes('main') || s.includes('roast') || s.includes('fry')) {
    return 'cooking';
  }
  return 'not indicated';
}

export function formatIngredientUsageLabel(usage: string): string | null {
  if (usage === 'not indicated') return null;
  return USAGE_LABELS[usage as Exclude<IngredientUsage, 'not indicated'>] ?? usage;
}

const USAGE_ORDER: IngredientUsage[] = [
  'cooking',
  'marination',
  'sauce',
  'garnish',
  'both',
  'not indicated',
];

export interface IngredientGroup {
  usage: IngredientUsage;
  label: string | null;
  items: Ingredient[];
}

/** Group ingredients by usage for sectioned display */
export function groupIngredientsByUsage(ingredients: Ingredient[]): IngredientGroup[] {
  const buckets = new Map<IngredientUsage, Ingredient[]>();

  for (const ingredient of ingredients) {
    const usage = normalizeIngredientUsage(ingredient.usage);
    const list = buckets.get(usage) ?? [];
    list.push(ingredient);
    buckets.set(usage, list);
  }

  return USAGE_ORDER.filter((usage) => buckets.has(usage)).map((usage) => ({
    usage,
    label: formatIngredientUsageLabel(usage),
    items: buckets.get(usage)!,
  }));
}
