import { View, Text } from 'react-native';

interface MetaChipProps {
  label: string;
  value: string;
}

export function MetaChip({ label, value }: MetaChipProps) {
  return (
    <View className="flex-row items-center gap-1.5 bg-orange-50/80 border border-orange-100 rounded-full px-3 py-1 self-start">
      <Text className="text-[10px] font-semibold text-warm-gray uppercase tracking-wide">
        {label}
      </Text>
      <Text className="text-xs font-semibold text-terracotta capitalize">{value}</Text>
    </View>
  );
}
