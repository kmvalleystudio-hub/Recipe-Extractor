/** Field with extracted value, status, and optional smart suggestion */
export interface ExtractedField {
  extracted: string;
  status: string;
  suggested: string;
  reason: string;
}

export interface Ingredient {
  name: string;
  extractedAmount: string;
  unitOrSize: string;
  /** marination | cooking | sauce | garnish | both | not indicated */
  usage: string;
  status: string;
  suggestedAmount: string;
  reasonForSuggestion: string;
}

export interface Instruction {
  stepNumber: number;
  instruction: string;
  missingDetails: string;
  suggestedValue: string;
  reasonForSuggestion: string;
}

export interface AlternativeIngredient {
  originalIngredient: string;
  alternativeIngredient: string;
  replacementRatio: string;
  whyItWorks: string;
  flavorTextureImpact: string;
  dietaryNote: string;
}

/** Full recipe extraction response from the backend API */
export interface RecipeExtraction {
  recipeTitle: string;
  description: string;
  sourceVideoUrl: string;
  confidenceScore: string;
  servings: ExtractedField;
  prepTime: ExtractedField;
  cookTime: ExtractedField;
  totalTime: ExtractedField;
  ingredients: Ingredient[];
  instructions: Instruction[];
  videoNotes: string[];
  missingDetailsSummary: string[];
  alternativeIngredients: AlternativeIngredient[];
}

/** Original text fetched from the video (captions, title, description) */
export interface SourceContent {
  /** Spoken words — YouTube captions or audio transcription */
  transcript: string;
  /** Facebook/Instagram post caption when separate from spoken audio */
  postCaption?: string;
  title: string;
  description: string;
  platform: string;
  sources: string[];
  /** ISO 639-1 language the user selected for this video */
  language?: string;
  /** Video preview image from platform (YouTube thumbnail or Facebook og:image) */
  thumbnailUrl?: string;
  /** Shown when caption is CTA-only and spoken transcript is missing */
  sourceWarning?: string;
}

/** Combined API response from POST /api/extract-recipe */
export interface ExtractRecipeResponse {
  recipe: RecipeExtraction;
  sourceContent: SourceContent;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: string;
}

export type SupportedPlatform = 'youtube' | 'facebook' | 'tiktok' | 'instagram' | 'unknown';

export interface UrlValidationResult {
  isValid: boolean;
  platform: SupportedPlatform;
  normalizedUrl?: string;
  error?: string;
}
