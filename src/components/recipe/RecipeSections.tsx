import { View, Text } from 'react-native';
import type { Ingredient } from '@/types/recipe';
import { Card, NotIndicatedBadge, SuggestionBox } from '@/components/ui/Card';
import { formatIngredientLine } from '@/utils/ingredientFormat';
import { groupIngredientsByUsage } from '@/utils/ingredientUsage';
import { isValidCookingStep } from '@/utils/instructionFilter';

interface IngredientsTableProps {
  ingredients: Ingredient[];
}

function sectionLabel(usage: string, label: string | null): string | null {
  if (!label) return null;
  if (usage === 'cooking') return 'Ingredients';
  if (usage === 'marination') return 'Marinade';
  return label;
}

function IngredientRow({ ingredient, index }: { ingredient: Ingredient; index: number }) {
  return (
    <View key={`${ingredient.name}-${index}`} className="flex-row items-start gap-3 py-2">
      <View className="w-2 h-2 rounded-full bg-peach mt-2.5" />
      <Text className="text-[15px] text-ink leading-6 flex-1">{formatIngredientLine(ingredient)}</Text>
    </View>
  );
}

function SectionDivider() {
  return <View className="h-4" />;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-lg font-bold text-ink mb-3">
      {title} :
    </Text>
  );
}

export function IngredientsTable({ ingredients }: IngredientsTableProps) {
  const groups = groupIngredientsByUsage(ingredients);
  const hasUsageGroups = groups.some((g) => g.label !== null && g.items.length > 0);
  const seenLines = new Set<string>();

  const isDuplicate = (ingredient: Ingredient) => {
    const key = formatIngredientLine(ingredient).toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key || seenLines.has(key)) return true;
    seenLines.add(key);
    return false;
  };

  return (
    <View>
      {hasUsageGroups
        ? groups.map((group, groupIndex) => {
            const label = sectionLabel(group.usage, group.label);
            const items = group.items.filter((ingredient) => !isDuplicate(ingredient));
            if (items.length === 0) return null;
            return (
              <View key={group.usage}>
                {groupIndex > 0 ? <SectionDivider /> : null}
                {label ? <SectionHeader title={label} /> : groupIndex === 0 ? <SectionHeader title="Ingredients" /> : null}
                {items.map((ingredient, index) => (
                  <IngredientRow
                    key={`${group.usage}-${ingredient.name}-${index}`}
                    ingredient={ingredient}
                    index={index}
                  />
                ))}
              </View>
            );
          })
        : (
          <>
            <SectionHeader title="Ingredients" />
            {ingredients
              .filter((ingredient) => !isDuplicate(ingredient))
              .map((ingredient, index) => (
                <IngredientRow key={`${ingredient.name}-${index}`} ingredient={ingredient} index={index} />
              ))}
          </>
        )}
    </View>
  );
}

interface InstructionsListProps {
  instructions: import('@/types/recipe').Instruction[];
}

export function InstructionsList({ instructions }: InstructionsListProps) {
  const steps = instructions
    .filter((s) => isValidCookingStep(s.instruction))
    .map((s, index) => ({ ...s, stepNumber: index + 1 }));

  if (steps.length === 0) {
    return (
      <View>
        <Text className="text-lg font-bold text-ink mb-3">Directions :</Text>
        <Text className="text-sm text-muted italic leading-5 py-2">
          No cooking steps were available for this video — there is no voiceover, captions, or written
          method in the post. Ingredients were taken from the caption; watch the video for how to cook
          it.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text className="text-lg font-bold text-ink mb-4">Directions :</Text>
      {steps.map((step, index) => (
        <View key={step.stepNumber} className={`flex-row gap-4 ${index < steps.length - 1 ? 'mb-5' : ''}`}>
          <Text className="text-2xl font-bold text-peach w-8">{step.stepNumber}</Text>
          <View className="flex-1 pt-0.5">
            <Text className="text-[15px] text-ink leading-6">{step.instruction}</Text>

            {step.missingDetails &&
            step.missingDetails.trim().toLowerCase() !== 'not indicated' &&
            step.missingDetails.trim() !== '' ? (
              <View className="mt-2">
                <Text className="text-xs text-muted">Missing detail</Text>
                <NotIndicatedBadge text={step.missingDetails} />
              </View>
            ) : null}

            <SuggestionBox
              label="Suggested value"
              value={step.suggestedValue}
              reason={step.reasonForSuggestion}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

interface AlternativesListProps {
  alternatives: import('@/types/recipe').AlternativeIngredient[];
}

export function AlternativesList({ alternatives }: AlternativesListProps) {
  if (alternatives.length === 0) {
    return (
      <Card>
        <Text className="text-muted text-center py-4">
          No alternative ingredients available for this recipe.
        </Text>
      </Card>
    );
  }

  return (
    <View className="gap-4">
      <Text className="text-lg font-bold text-ink mb-1">Alternatives :</Text>
      {alternatives.map((alt, index) => (
        <Card key={`${alt.originalIngredient}-${index}`}>
          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-base font-bold text-ink flex-1">{alt.originalIngredient}</Text>
            <Text className="text-mint">→</Text>
            <Text className="text-base font-bold text-mint-dark flex-1 text-right">
              {alt.alternativeIngredient}
            </Text>
          </View>

          <DetailRow label="Replacement ratio" value={alt.replacementRatio} />
          <DetailRow label="Why it works" value={alt.whyItWorks} />
          <DetailRow label="Flavor / texture" value={alt.flavorTextureImpact} />
          {alt.dietaryNote ? <DetailRow label="Dietary note" value={alt.dietaryNote} /> : null}
        </Card>
      ))}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const noAlternative =
    value.toLowerCase().includes('no close alternative') ||
    value.toLowerCase().includes('not recommended');

  return (
    <View className="mb-2">
      <Text className="text-xs text-muted font-medium">{label}</Text>
      <Text className={`text-sm mt-0.5 ${noAlternative ? 'text-peach-dark italic' : 'text-ink'}`}>
        {value}
      </Text>
    </View>
  );
}
