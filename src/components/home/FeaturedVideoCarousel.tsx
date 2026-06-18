import { Platform, View, Text, ScrollView, Pressable, Image } from 'react-native';
import { FEATURED_VIDEOS, type FeaturedVideo } from '@/constants/featuredVideos';

interface FeaturedVideoCarouselProps {
  onSelectVideo: (videoUrl: string) => void;
}

const CARD_WIDTH = 260;
const VIDEO_HEIGHT = 146;

function WebVideoEmbed({ youtubeId }: { youtubeId: string }) {
  if (Platform.OS !== 'web') return null;

  return (
    <iframe
      src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
      title="Featured cooking video"
      style={{
        width: '100%',
        height: '100%',
        border: 0,
        borderRadius: 16,
      }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}

function VideoCard({ video, onSelect }: { video: FeaturedVideo; onSelect: () => void }) {
  const thumbnail = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;

  return (
    <View
      className="mr-4 bg-white rounded-3xl overflow-hidden border border-gray-100"
      style={{
        width: CARD_WIDTH,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      <View style={{ width: CARD_WIDTH, height: VIDEO_HEIGHT }} className="bg-black overflow-hidden">
        {Platform.OS === 'web' ? (
          <WebVideoEmbed youtubeId={video.youtubeId} />
        ) : (
          <Pressable onPress={onSelect} className="flex-1">
            <Image
              source={{ uri: thumbnail }}
              style={{ width: CARD_WIDTH, height: VIDEO_HEIGHT }}
              resizeMode="cover"
            />
          </Pressable>
        )}
      </View>

      <View className="p-3">
        <Text className="text-[15px] font-bold text-ink leading-5" numberOfLines={2}>
          {video.title}
        </Text>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-xs font-bold text-mint-dark uppercase">{video.duration}</Text>
          <Pressable onPress={onSelect} hitSlop={8}>
            <Text className="text-xs font-bold text-mint">Use video →</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function FeaturedVideoCarousel({ onSelectVideo }: FeaturedVideoCarouselProps) {
  return (
    <View className="mt-8">
      <Text className="text-lg font-bold text-ink mb-1">Try these recipes</Text>
      <Text className="text-sm text-muted mb-4">Watch a clip or tap “Use video” to extract</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="pr-5"
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 16}
      >
        {FEATURED_VIDEOS.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onSelect={() => onSelectVideo(video.videoUrl)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
