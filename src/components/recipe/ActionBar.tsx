import * as Clipboard from 'expo-clipboard';
import { View, Text, Pressable, Share, Alert } from 'react-native';
import type { RecipeExtraction } from '@/types/recipe';
import {
  formatAlternativesForCopy,
  formatIngredientsForCopy,
  formatRecipeForCopy,
} from '@/utils/recipeValidation';

interface ActionBarProps {
  recipe: RecipeExtraction;
}

function ActionButton({ label, onPress, accent }: { label: string; onPress: () => void; accent?: 'mint' }) {
  return (
    <Pressable
      className={`flex-1 rounded-2xl py-3 items-center ${
        accent === 'mint' ? 'bg-mint-light' : 'bg-surface'
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-xs font-bold ${accent === 'mint' ? 'text-mint-dark' : 'text-ink'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ActionBar({ recipe }: ActionBarProps) {
  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard.`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: recipe.recipeTitle,
        message: formatRecipeForCopy(recipe),
      });
    } catch {
      // User cancelled share
    }
  };

  return (
    <View className="gap-2 mt-6">
      <View className="flex-row gap-2">
        <ActionButton label="Copy recipe" onPress={() => handleCopy(formatRecipeForCopy(recipe), 'Full recipe')} />
        <ActionButton label="Copy ingredients" onPress={() => handleCopy(formatIngredientsForCopy(recipe), 'Ingredients')} />
      </View>
      <View className="flex-row gap-2">
        <ActionButton label="Copy alternatives" onPress={() => handleCopy(formatAlternativesForCopy(recipe), 'Alternatives')} />
        <ActionButton label="Share" onPress={handleShare} accent="mint" />
      </View>
    </View>
  );
}
