import { useState, useRef } from 'react';

import { Animated, View, Text, Pressable } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';



import { TabBar } from '@/components/ui/TabBar';

import { ContentPanel } from '@/components/ui/ContentPanel';

import { InfoChip } from '@/components/ui/InfoChip';



import { Disclaimer } from '@/components/ui/Card';



import {

  IngredientsTable,

  InstructionsList,

  AlternativesList,

} from '@/components/recipe/RecipeSections';



import { TranscriptionPanel } from '@/components/recipe/TranscriptionPanel';

import { ActionBar } from '@/components/recipe/ActionBar';



import { Button } from '@/components/ui/Button';



import { useRecipeStore } from '@/store/recipeStore';

import { formatDetailList } from '@/utils/ingredientFormat';

import { resolveRecipeThumbnail } from '@/utils/thumbnails';

import { formatMetaValue } from '@/utils/recipeMeta';

import {

  ParallaxRecipeHero,

  parallaxScrollHandler,

} from '@/components/recipe/ParallaxRecipeHero';



const TABS = [

  { key: 'ingredients', label: 'Ingredients' },

  { key: 'instructions', label: 'Directions' },

  { key: 'transcription', label: 'Source' },

  { key: 'alternatives', label: 'Swaps' },

];



export default function ResultsScreen() {

  const router = useRouter();

  const insets = useSafeAreaInsets();

  const scrollY = useRef(new Animated.Value(0)).current;



  const { currentRecipe, sourceContent, currentVideoUrl } = useRecipeStore();



  const [activeTab, setActiveTab] = useState('ingredients');



  if (!currentRecipe) {

    return (

      <View className="flex-1 bg-white items-center justify-center px-6" style={{ paddingTop: insets.top }}>

        <Text className="text-ink text-lg text-center mb-4">No recipe to display yet.</Text>

        <Button title="Go Home" onPress={() => router.replace('/')} />

      </View>

    );

  }



  const recipe = currentRecipe;

  const missingDetails = formatDetailList(recipe.missingDetailsSummary);

  const videoNotes = formatDetailList(recipe.videoNotes);

  const thumbnailUri = resolveRecipeThumbnail(sourceContent?.thumbnailUrl, currentVideoUrl);



  const totalTime =
    formatMetaValue(recipe.totalTime) ??
    formatMetaValue(recipe.cookTime) ??
    formatMetaValue(recipe.prepTime);
  const servings = formatMetaValue(recipe.servings);
  const confidence = recipe.confidenceScore?.trim();

  const metaChips = [
    { id: 'time', icon: '⏱', label: totalTime ?? '--', variant: 'mint' as const },
    { id: 'confidence', icon: '✓', label: confidence ?? '--', variant: 'peach' as const },
    { id: 'servings', icon: '🍽', label: servings ?? '--', variant: 'sky' as const },
  ];



  return (

    <View className="flex-1 bg-white">

      <Animated.ScrollView

        className="flex-1"

        contentContainerClassName="pb-10"

        showsVerticalScrollIndicator={false}

        scrollEventThrottle={16}

        onScroll={parallaxScrollHandler(scrollY)}

      >

        {thumbnailUri ? (

          <ParallaxRecipeHero uri={thumbnailUri} alt={recipe.recipeTitle} scrollY={scrollY} />

        ) : (

          <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4">

            <Pressable onPress={() => router.back()} className="flex-row items-center gap-2" hitSlop={8}>

              <Ionicons name="arrow-back" size={22} color="#1A1A1A" />

              <Text className="text-base font-semibold text-ink">Back</Text>

            </Pressable>

          </View>

        )}



        <View

          className="bg-white rounded-t-[28px] -mt-6 px-5 pt-6"

          style={{ paddingBottom: insets.bottom + 16 }}

        >

          <Text className="text-2xl font-bold text-ink leading-8 mb-3">

            {recipe.recipeTitle}

          </Text>



          <View className="flex-row gap-2 mb-4">
            {metaChips.map((chip) => (
              <InfoChip key={chip.id} icon={chip.icon} label={chip.label} variant={chip.variant} />
            ))}
          </View>

          {sourceContent?.sourceWarning ? (
            <View className="bg-peach-light rounded-2xl px-4 py-3 mb-4">
              <Text className="text-sm font-semibold text-peach-dark mb-1">Transcript required</Text>
              <Text className="text-sm text-ink leading-5">{sourceContent.sourceWarning}</Text>
            </View>
          ) : null}

          {recipe.description ? (

            <Text className="text-sm text-muted leading-6 mb-4">{recipe.description}</Text>

          ) : null}



          <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />



          <ContentPanel>

            {activeTab === 'ingredients' ? (

              <IngredientsTable ingredients={recipe.ingredients} />

            ) : activeTab === 'instructions' ? (

              <View>

                <InstructionsList instructions={recipe.instructions} />



                {videoNotes.length > 0 ? (

                  <View className="mt-8">

                    <Text className="text-lg font-bold text-ink mb-3">Notes :</Text>

                    {videoNotes.map((note, i) => (

                      <Text key={i} className="text-sm text-ink leading-6 mb-2">

                        {note}

                      </Text>

                    ))}

                  </View>

                ) : null}



                {missingDetails.length > 0 ? (

                  <View className="mt-6">

                    <Text className="text-lg font-bold text-ink mb-3">Suggestions :</Text>

                    {missingDetails.map((detail, i) => (

                      <Text key={i} className="text-sm text-ink leading-6 mb-2">

                        {detail}

                      </Text>

                    ))}

                  </View>

                ) : null}

              </View>

            ) : activeTab === 'transcription' ? (

              sourceContent ? (

                <TranscriptionPanel source={sourceContent} videoUrl={currentVideoUrl} embedded />

              ) : (

                <Text className="text-muted text-center py-4 text-sm">

                  No source transcription available for this extraction.

                </Text>

              )

            ) : (

              <AlternativesList alternatives={recipe.alternativeIngredients} />

            )}

          </ContentPanel>



          <Disclaimer className="mt-6" />



          <ActionBar recipe={recipe} />



          <View className="mt-5">

            <Button title="Extract Another Recipe" variant="outline" onPress={() => router.replace('/')} />

          </View>

        </View>

      </Animated.ScrollView>

    </View>

  );

}

