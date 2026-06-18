import { View } from 'react-native';

export function SkeletonBox({ className = '' }: { className?: string }) {
  return <View className={`bg-surface rounded-2xl ${className}`} />;
}

export function RecipeSkeleton() {
  return (
    <View className="gap-4">
      <SkeletonBox className="h-8 w-3/4" />
      <SkeletonBox className="h-4 w-full" />
      <SkeletonBox className="h-4 w-5/6" />
      <View className="flex-row gap-3 mt-2">
        <SkeletonBox className="h-16 flex-1" />
        <SkeletonBox className="h-16 flex-1" />
        <SkeletonBox className="h-16 flex-1" />
      </View>
      <SkeletonBox className="h-32 w-full mt-2" />
      <SkeletonBox className="h-48 w-full" />
      <SkeletonBox className="h-40 w-full" />
    </View>
  );
}
