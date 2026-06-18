import { useState } from 'react';

import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, TextInput } from 'react-native';

import { useRouter, Link } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';

import { Card } from '@/components/ui/Card';

import { RecipeSkeleton } from '@/components/ui/Skeleton';

import { useRecipeStore } from '@/store/recipeStore';

import { LanguageSelect } from '@/components/ui/LanguageSelect';
import { DEFAULT_VIDEO_LANGUAGE } from '@/constants/languages';
import { validateVideoUrl } from '@/utils/urlValidation';
import { extractRecipe, ExtractRecipeError } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { FeaturedVideoCarousel } from '@/components/home/FeaturedVideoCarousel';

export default function HomeScreen() {
  const router = useRouter();

  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState(DEFAULT_VIDEO_LANGUAGE);

  const [urlError, setUrlError] = useState<string | undefined>();

  const { isLoading, error, recentUrls, setLoading, setError, setExtractionResult, addRecentUrl } =
    useRecipeStore();

  const handleExtract = async () => {
    const validation = validateVideoUrl(url);

    if (!validation.isValid) {
      setUrlError(validation.error);
      return;
    }

    setUrlError(undefined);
    setLoading(true);

    try {
      const result = await extractRecipe({
        videoUrl: validation.normalizedUrl!,
        language,
      });
      setExtractionResult(result, validation.normalizedUrl!);

      addRecentUrl(validation.normalizedUrl!);

      router.push('/results');
    } catch (err) {
      const message =
        err instanceof ExtractRecipeError
          ? err.message
          : 'Something went wrong. Please try again.';
      setError(message);
    }
  };

  const handleSelectVideo = (videoUrl: string) => {
    setUrl(videoUrl);
    setUrlError(undefined);
    setError(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="pt-2 pb-6 flex-row items-center justify-between">
            <Pressable className="w-10 h-10 items-center justify-center">
              <Ionicons name="menu" size={26} color="#1A1A1A" />
            </Pressable>
            <Link href="/settings" asChild>
              <Pressable className="w-10 h-10 items-center justify-center">
                <Ionicons name="settings-outline" size={24} color="#1A1A1A" />
              </Pressable>
            </Link>
          </View>

          <View className="pb-6">
            <Text className="text-[28px] font-bold text-ink leading-9">
              What would you like to cook?
            </Text>
            <Text className="text-sm text-muted mt-2 leading-5">
              Paste a cooking video URL and turn it into an organized recipe.
            </Text>
          </View>

          <View className="mb-1">
            <View className="bg-surface rounded-full flex-row items-center px-5 py-3.5">
              <Ionicons name="search" size={20} color="#8E8E93" />
              <TextInput
                className="flex-1 ml-3 text-base text-ink"
                placeholder="Paste YouTube or Facebook video URL"
                placeholderTextColor="#8E8E93"
                value={url}
                onChangeText={(text) => {
                  setUrl(text);
                  setUrlError(undefined);
                  setError(null);
                }}
                editable={!isLoading}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {urlError ? <Text className="text-error-text text-sm mt-1.5 px-2">{urlError}</Text> : null}
          </View>

          <View className="mt-4">
            <LanguageSelect
              value={language}
              onChange={setLanguage}
              hint="Select the language spoken in the video."
              disabled={isLoading}
            />
          </View>

          <View className="mt-5">
            <Button title="Extract Recipe" onPress={handleExtract} loading={isLoading} />
          </View>

          {error ? (
            <Card className="mt-4 bg-error border-red-200">
              <Text className="text-error-text font-medium">{error}</Text>
            </Card>
          ) : null}

          {isLoading ? (
            <View className="mt-6">
              <Text className="text-muted text-center mb-4">Extracting recipe from video...</Text>
              <RecipeSkeleton />
            </View>
          ) : null}

          {!isLoading ? <FeaturedVideoCarousel onSelectVideo={handleSelectVideo} /> : null}

          {recentUrls.length > 0 ? (
            <View className="mt-8">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold text-ink">Recent</Text>
              </View>
              {recentUrls.map((recentUrl) => (
                <Pressable
                  key={recentUrl}
                  onPress={() => handleSelectVideo(recentUrl)}
                  className="bg-white rounded-2xl px-4 py-3.5 mb-2 border border-gray-100 flex-row items-center gap-3"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View className="w-10 h-10 rounded-xl bg-mint-light items-center justify-center">
                    <Text>🔗</Text>
                  </View>
                  <Text className="text-sm text-ink flex-1" numberOfLines={1}>
                    {recentUrl}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
