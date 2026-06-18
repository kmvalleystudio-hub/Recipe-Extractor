import { View, Text, Pressable, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Card } from '@/components/ui/Card';
import type { SourceContent } from '@/types/recipe';
import { getLanguageLabel } from '@/constants/languages';
import { formatTranscriptForCopy } from '@/utils/recipeValidation';

interface TranscriptionPanelProps {
  source: SourceContent;
  videoUrl: string;
  /** When true, renders flat sections without nested cards (inside ContentPanel) */
  embedded?: boolean;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function TranscriptionPanel({ source, videoUrl, embedded = false }: TranscriptionPanelProps) {
  const spokenText = source.transcript.trim();
  const captionText = source.postCaption?.trim() ?? '';
  const hasSpoken = spokenText.length > 0;
  const hasCaption = captionText.length > 0;
  const hasAnyText = hasSpoken || hasCaption;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(formatTranscriptForCopy(source));
    Alert.alert('Copied', 'Source text copied to clipboard.');
  };

  const Section = embedded ? View : Card;
  const sectionClass = embedded ? 'mb-5 pb-5 border-b border-gray-100' : '';

  const transcriptLabel =
    source.platform === 'facebook'
      ? 'Spoken transcript'
      : source.sources.includes('audio_transcription')
        ? 'Spoken transcript (audio)'
        : 'Transcript / captions';

  return (
    <View className={embedded ? '' : 'gap-4'}>
      <Text className="text-lg font-bold text-ink mb-4">Source :</Text>

      <Section className={sectionClass}>
        <Text className="text-xs text-muted uppercase tracking-wide mb-2">URL</Text>
        <Text className="text-sm text-ink leading-5" selectable>
          {videoUrl}
        </Text>
        <View className="flex-row flex-wrap gap-2 mt-3">
          <Badge label={`Platform: ${source.platform}`} />
          {source.language ? (
            <Badge label={`Language: ${getLanguageLabel(source.language)}`} />
          ) : null}
          {source.sources.map((s) => (
            <Badge key={s} label={s} />
          ))}
        </View>
      </Section>

      {source.title ? (
        <Section className={sectionClass}>
          <Text className="text-xs text-muted uppercase tracking-wide mb-1">Video title</Text>
          <Text className="text-sm font-semibold text-ink leading-6" selectable>
            {source.title}
          </Text>
        </Section>
      ) : null}

      {source.description ? (
        <Section className={sectionClass}>
          <Text className="text-xs text-muted uppercase tracking-wide mb-1">Description</Text>
          <Text className="text-sm text-ink leading-6" selectable>
            {source.description}
          </Text>
        </Section>
      ) : null}

      {hasCaption ? (
        <Section className={sectionClass}>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs text-muted uppercase tracking-wide">Post caption</Text>
            <Text className="text-xs text-muted">{wordCount(captionText)} words</Text>
          </View>
          <Text className="text-sm text-ink leading-6" selectable>
            {captionText}
          </Text>
        </Section>
      ) : null}

      <Section className={embedded ? '' : ''}>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs text-muted uppercase tracking-wide">{transcriptLabel}</Text>
          {hasSpoken ? (
            <Text className="text-xs text-muted">{wordCount(spokenText)} words</Text>
          ) : null}
        </View>

        {hasSpoken ? (
          <Text className="text-sm text-ink leading-6" selectable>
            {spokenText}
          </Text>
        ) : (
          <Text className="text-sm text-muted italic leading-5">
            {source.platform === 'facebook'
              ? 'No spoken transcript yet. The backend downloads video audio with yt-dlp and transcribes it (OpenAI Whisper or a local Whisper API). Check backend logs if this stays empty.'
              : 'No transcript or captions were available for this video. The recipe may have been extracted from the title or description only, or from manual transcript text you provided.'}
          </Text>
        )}
      </Section>

      {hasAnyText ? (
        <Pressable
          className="bg-mint-light rounded-2xl py-3 items-center mt-2"
          onPress={handleCopy}
        >
          <Text className="text-sm font-bold text-mint-dark">Copy source text</Text>
        </Pressable>
      ) : null}

      {!embedded ? (
        <Text className="text-xs text-muted leading-5">
          Compare spoken transcript and post caption with Ingredients and Directions — this is what
          the AI used for extraction.
        </Text>
      ) : null}
    </View>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <View className="bg-peach-light rounded-full px-3 py-1">
      <Text className="text-xs text-peach-dark font-semibold">{label}</Text>
    </View>
  );
}
