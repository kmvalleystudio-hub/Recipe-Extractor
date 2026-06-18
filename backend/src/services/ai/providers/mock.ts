import type { AiProvider, ExtractionInput } from '../types';
import type { RecipeExtraction } from '../../../schemas/recipe';

/**
 * Mock provider — returns sample recipe JSON without calling any AI service.
 * Use AI_PROVIDER=mock to test the mobile UI when Ollama is not running.
 */
export class MockProvider implements AiProvider {
  name = 'mock' as const;

  async extractRecipe(input: ExtractionInput): Promise<RecipeExtraction> {
    // Simulate a short delay so loading states feel realistic
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      recipeTitle: 'Garlic Butter Pasta (Mock Sample)',
      description:
        'A quick creamy pasta dish. This is sample data from the mock provider for UI testing.',
      sourceVideoUrl: input.videoUrl,
      confidenceScore: 'medium',
      servings: {
        extracted: 'not indicated',
        status: 'Missing serving count',
        suggested: '3-4 servings',
        reason: 'Typical portion for a pasta dish with 400g pasta.',
      },
      prepTime: {
        extracted: '10 minutes',
        status: 'Extracted',
        suggested: '',
        reason: '',
      },
      cookTime: {
        extracted: 'not indicated',
        status: 'Missing cook time',
        suggested: '15 minutes',
        reason: 'Standard time to cook pasta al dente and combine with sauce.',
      },
      totalTime: {
        extracted: 'not indicated',
        status: 'Missing total time',
        suggested: '25 minutes',
        reason: 'Prep plus cook time combined.',
      },
      ingredients: [
        {
          name: 'Pasta',
          extractedAmount: '400',
          unitOrSize: 'grams',
          usage: 'cooking',
          status: 'Extracted',
          suggestedAmount: '',
          reasonForSuggestion: '',
        },
        {
          name: 'Garlic',
          extractedAmount: 'not indicated',
          unitOrSize: 'not indicated',
          usage: 'cooking',
          status: 'Missing amount',
          suggestedAmount: '4 cloves',
          reasonForSuggestion: 'Common amount for a savory pasta serving 3-4 people.',
        },
        {
          name: 'Butter',
          extractedAmount: 'not indicated',
          unitOrSize: 'not indicated',
          usage: 'cooking',
          status: 'Missing amount',
          suggestedAmount: '50g',
          reasonForSuggestion: 'Enough to create a light garlic butter sauce.',
        },
      ],
      instructions: [
        {
          stepNumber: 1,
          instruction: 'Boil pasta in salted water until al dente.',
          missingDetails: 'not indicated',
          suggestedValue: '',
          reasonForSuggestion: '',
        },
        {
          stepNumber: 2,
          instruction: 'Melt butter in a pan and sauté minced garlic until fragrant.',
          missingDetails: 'Heat level not indicated',
          suggestedValue: 'Medium-low heat for 1-2 minutes',
          reasonForSuggestion: 'Prevents garlic from burning while releasing flavor.',
        },
        {
          stepNumber: 3,
          instruction: 'Toss drained pasta with the garlic butter and serve.',
          missingDetails: 'not indicated',
          suggestedValue: '',
          reasonForSuggestion: '',
        },
      ],
      videoNotes: ['Sample note: add parsley if mentioned in your transcript.'],
      missingDetailsSummary: [
        'Garlic amount not stated in source text',
        'Butter quantity not stated',
        'Cook time not specified',
      ],
      alternativeIngredients: [
        {
          originalIngredient: 'Butter',
          alternativeIngredient: 'Olive oil',
          replacementRatio: '1:1 by volume',
          whyItWorks: 'Provides fat for sautéing garlic and coating pasta.',
          flavorTextureImpact: 'Lighter, fruitier flavor; less creamy mouthfeel.',
          dietaryNote: 'Dairy-free / vegan',
        },
        {
          originalIngredient: 'Regular pasta',
          alternativeIngredient: 'Gluten-free pasta',
          replacementRatio: '1:1',
          whyItWorks: 'Same cooking method; swap directly.',
          flavorTextureImpact: 'Texture may be slightly different depending on brand.',
          dietaryNote: 'Gluten-free',
        },
      ],
    };
  }
}
