import type { RecipeExtraction } from '../schemas/recipe';
import { normalizeIngredientUsage } from './ingredientUsage';

type Ingredient = RecipeExtraction['ingredients'][number];

interface TitleIngredientRule {
  pattern: RegExp;
  name: string;
  usage: string;
}

const TITLE_INGREDIENT_RULES: TitleIngredientRule[] = [
  { pattern: /\bmarble\s+potatoes?\b/i, name: 'marble potatoes', usage: 'cooking' },
  { pattern: /\b(?:peri\s*peri\s+)?chicken\b/i, name: 'chicken', usage: 'cooking' },
  { pattern: /\bbeef\b/i, name: 'beef', usage: 'cooking' },
  { pattern: /\bpork\b/i, name: 'pork', usage: 'cooking' },
  { pattern: /\bsalmon\b/i, name: 'salmon', usage: 'cooking' },
  { pattern: /\bshrimp\b/i, name: 'shrimp', usage: 'cooking' },
  { pattern: /\bfish\b/i, name: 'fish', usage: 'cooking' },
  { pattern: /\btofu\b/i, name: 'tofu', usage: 'cooking' },
  { pattern: /\bpasta\b/i, name: 'pasta', usage: 'cooking' },
  { pattern: /\bnoodles?\b/i, name: 'noodles', usage: 'cooking' },
];

function ingredientAlreadyListed(ingredients: Ingredient[], name: string): boolean {
  const needle = name.toLowerCase();
  return ingredients.some((i) => {
    const hay = i.name.toLowerCase();
    return hay.includes(needle) || needle.includes(hay);
  });
}

function makeMissingIngredient(name: string, usage: string): Ingredient {
  return {
    name,
    extractedAmount: 'not indicated',
    unitOrSize: 'not indicated',
    usage,
    status: 'Inferred from recipe title',
    suggestedAmount: '',
    reasonForSuggestion: '',
  };
}

/**
 * Add main dish components mentioned in the title (e.g. "Chicken and Marble Potatoes")
 * when the caption ingredient list omitted them.
 */
export function fillTitleIngredients(recipe: RecipeExtraction): RecipeExtraction {
  const title = recipe.recipeTitle;
  const additions: Ingredient[] = [];

  for (const rule of TITLE_INGREDIENT_RULES) {
    if (rule.pattern.test(title) && !ingredientAlreadyListed(recipe.ingredients, rule.name)) {
      additions.push(makeMissingIngredient(rule.name, rule.usage));
    }
  }

  if (additions.length === 0) return recipe;

  const cooking = recipe.ingredients.filter(
    (i) => normalizeIngredientUsage(i.usage) === 'cooking'
  );
  const rest = recipe.ingredients.filter(
    (i) => normalizeIngredientUsage(i.usage) !== 'cooking'
  );

  return {
    ...recipe,
    ingredients: [...cooking, ...additions, ...rest],
  };
}
