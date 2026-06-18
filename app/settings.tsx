import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Card } from '@/components/ui/Card';

export default function SettingsScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <ScrollView className="flex-1" contentContainerClassName="px-5 py-4">
        <Card className="mb-4">
          <Text className="text-xs text-muted uppercase tracking-wide">App name</Text>
          <Text className="text-xl font-bold text-ink mt-1">Recipe Extractor</Text>
        </Card>

        <Card className="mb-4">
          <Text className="text-xs text-muted uppercase tracking-wide">Version</Text>
          <Text className="text-base text-ink mt-1">{version}</Text>
        </Card>

        <Card>
          <Text className="text-xs text-muted uppercase tracking-wide mb-2">Privacy</Text>
          <Text className="text-sm text-ink leading-6">
            This app only processes video URLs you submit. Video content is fetched from publicly
            accessible sources such as captions, transcripts, and descriptions. We do not access
            private or restricted videos.
          </Text>
          <Text className="text-sm text-muted leading-6 mt-3">
            Recipe suggestions are estimates and should be adjusted to your taste and dietary needs.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
