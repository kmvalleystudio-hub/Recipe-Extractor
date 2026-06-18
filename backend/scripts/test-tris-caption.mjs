import { parseCaptionIngredients } from '../src/utils/parseCaptionIngredients.ts';
import { sanitizeRecipeIngredients } from '../src/utils/sanitizeIngredients.ts';

const caption = `Crispy Honey Butter Chicken 🍗

Ingredients:
-3 pcs chicken chop
-2 tbsp light soy sauce
-1 tbsp oyster sauce
-1 tbsp garlic
-4-6 pcs ginger
-0.5 tsp black pepper
-Cornstarch

Sauce:
-2 tbsp Anchor unsalted pure butter
-1 tbsp garlic
-3 tbsp honey
-2 tbsp light soy sauce`;

const parsed = parseCaptionIngredients(caption);
console.log('Parsed:', parsed.length);
parsed.forEach((p) => console.log(`[${p.usage}] ${p.extractedAmount} | ${p.name}`));

const fakeRecipe = {
  recipeTitle: 'Test',
  description: '',
  sourceVideoUrl: '',
  confidenceScore: 'low',
  servings: { extracted: '', status: '', suggested: '', reason: '' },
  prepTime: { extracted: '', status: '', suggested: '', reason: '' },
  cookTime: { extracted: '', status: '', suggested: '', reason: '' },
  totalTime: { extracted: '', status: '', suggested: '', reason: '' },
  ingredients: parsed.map((p) => ({
    name: p.name,
    extractedAmount: p.extractedAmount,
    unitOrSize: 'not indicated',
    usage: p.usage,
    status: '',
    suggestedAmount: '',
    reasonForSuggestion: '',
  })),
  instructions: [],
  videoNotes: [],
  missingDetailsSummary: [],
  alternativeIngredients: [],
};

const cleaned = sanitizeRecipeIngredients(fakeRecipe);
console.log('\nFormatted:');
cleaned.ingredients.forEach((i) => {
  const amt = i.extractedAmount === 'not indicated' ? '' : i.extractedAmount;
  console.log(`[${i.usage}] ${amt} ${i.name}`.trim());
});
