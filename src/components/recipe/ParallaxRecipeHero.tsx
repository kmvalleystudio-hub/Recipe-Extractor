import { useRef } from 'react';
import { Animated, Image, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ParallaxRecipeHeroProps {
  uri: string;
  alt: string;
  scrollY: Animated.Value;
}

export const HERO_HEIGHT = 300;
const IMAGE_EXTRA = 80;

export function ParallaxRecipeHero({ uri, alt, scrollY }: ParallaxRecipeHeroProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT],
    outputRange: [0, HERO_HEIGHT * 0.45],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-120, 0],
    outputRange: [1.25, 1],
    extrapolate: 'clamp',
  });

  return (
    <View className="relative w-full overflow-hidden" style={{ height: HERO_HEIGHT }}>
      <Animated.View
        style={{
          transform: [{ translateY: imageTranslateY }, { scale: imageScale }],
          height: HERO_HEIGHT + IMAGE_EXTRA,
          width: '100%',
          marginTop: -IMAGE_EXTRA / 2,
        }}
      >
        <Image
          source={{ uri }}
          accessibilityLabel={alt}
          resizeMode="cover"
          style={{ width: '100%', height: HERO_HEIGHT + IMAGE_EXTRA }}
        />
      </Animated.View>

      <View
        className="absolute inset-x-0 bottom-0 h-20 bg-black/25"
        pointerEvents="none"
      />

      <Pressable
        onPress={() => router.back()}
        className="absolute left-4 w-10 h-10 rounded-full bg-white/90 items-center justify-center"
        style={{ top: insets.top + 8, zIndex: 10 }}
        hitSlop={8}
      >
        <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
      </Pressable>
    </View>
  );
}

export function useParallaxScrollY() {
  return useRef(new Animated.Value(0)).current;
}

export function parallaxScrollHandler(scrollY: Animated.Value) {
  return Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );
}
