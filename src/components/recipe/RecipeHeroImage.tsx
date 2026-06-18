import { Image, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface RecipeHeroImageProps {
  uri: string;
  alt: string;
  showBack?: boolean;
}

const HERO_HEIGHT = 280;

export function RecipeHeroImage({ uri, alt, showBack = true }: RecipeHeroImageProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="relative w-full" style={{ height: HERO_HEIGHT }}>
      <Image
        source={{ uri }}
        accessibilityLabel={alt}
        resizeMode="cover"
        style={{ width: '100%', height: HERO_HEIGHT }}
      />
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          className="absolute left-4 w-10 h-10 rounded-full bg-white/90 items-center justify-center"
          style={{ top: insets.top + 8 }}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </Pressable>
      ) : null}
    </View>
  );
}

export const RECIPE_HERO_HEIGHT = HERO_HEIGHT;
