import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View className="mb-4">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between py-2"
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View className="flex-1 pr-2">
          <Text className="text-lg font-bold text-walnut">{title}</Text>
          {subtitle ? (
            <Text className="text-sm text-warm-gray mt-0.5">{subtitle}</Text>
          ) : null}
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={22}
          color="#8B7E74"
        />
      </Pressable>
      {open ? <View className="mt-1">{children}</View> : null}
    </View>
  );
}
