import { View, Text } from 'react-native';

type ChipVariant = 'mint' | 'peach' | 'sky';

interface InfoChipProps {
  icon: string;
  label: string;
  variant?: ChipVariant;
}

const VARIANTS: Record<ChipVariant, { bg: string; text: string }> = {
  mint: { bg: 'bg-mint-light', text: 'text-mint-dark' },
  peach: { bg: 'bg-peach-light', text: 'text-peach-dark' },
  sky: { bg: 'bg-sky-light', text: 'text-sky-dark' },
};

export function InfoChip({ icon, label, variant = 'mint' }: InfoChipProps) {
  const colors = VARIANTS[variant];
  const isPlaceholder = label === '--';
  return (
    <View className={`flex-1 ${colors.bg} rounded-2xl px-3 py-3 items-center`}>
      <Text className="text-base mb-0.5">{icon}</Text>
      <Text
        className={`text-[11px] font-bold uppercase tracking-wide ${
          isPlaceholder ? 'text-muted' : colors.text
        }`}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}
