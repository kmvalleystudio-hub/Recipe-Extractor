import { create } from 'zustand';
import type { ExtractRecipeResponse, RecipeExtraction, SourceContent } from '@/types/recipe';

interface RecipeState {
  currentRecipe: RecipeExtraction | null;
  sourceContent: SourceContent | null;
  currentVideoUrl: string;
  isLoading: boolean;
  error: string | null;
  recentUrls: string[];

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setExtractionResult: (result: ExtractRecipeResponse, videoUrl: string) => void;
  clearRecipe: () => void;
  addRecentUrl: (url: string) => void;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  currentRecipe: null,
  sourceContent: null,
  currentVideoUrl: '',
  isLoading: false,
  error: null,
  recentUrls: [],

  setLoading: (loading) => set({ isLoading: loading, error: loading ? null : undefined }),

  setError: (error) => set({ error, isLoading: false }),

  setExtractionResult: (result, videoUrl) =>
    set({
      currentRecipe: result.recipe,
      sourceContent: result.sourceContent,
      currentVideoUrl: videoUrl,
      isLoading: false,
      error: null,
    }),

  clearRecipe: () =>
    set({
      currentRecipe: null,
      sourceContent: null,
      currentVideoUrl: '',
      error: null,
    }),

  addRecentUrl: (url) =>
    set((state) => ({
      recentUrls: [url, ...state.recentUrls.filter((u) => u !== url)].slice(0, 5),
    })),
}));
