import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { VIDEO_LANGUAGES, type LanguageOption } from '@/constants/languages';

interface LanguageSelectProps {
  label?: string;
  hint?: string;
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

export function LanguageSelect({
  label = 'Video language',
  hint,
  value,
  onChange,
  disabled = false,
}: LanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = VIDEO_LANGUAGES.find((l) => l.code === value) ?? VIDEO_LANGUAGES[0];

  const handleSelect = (option: LanguageOption) => {
    onChange(option.code);
    setOpen(false);
  };

  return (
    <View className="w-full">
      {label ? <Text className="text-sm font-semibold text-ink mb-2">{label}</Text> : null}

      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={`bg-surface rounded-2xl px-5 py-4 flex-row items-center justify-between ${
          disabled ? 'opacity-60' : ''
        }`}
      >
        <Text className="text-base text-ink">{selected.label}</Text>
        <Text className="text-muted text-lg">▾</Text>
      </Pressable>

      {hint ? <Text className="text-xs text-muted mt-1.5 leading-4">{hint}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setOpen(false)}>
          <Pressable className="bg-white rounded-t-3xl max-h-[70%]" onPress={(e) => e.stopPropagation()}>
            <View className="px-5 py-4 border-b border-gray-100">
              <Text className="text-lg font-bold text-ink">Video language</Text>
              <Text className="text-sm text-muted mt-1">
                Helps fetch the right captions and extract text accurately.
              </Text>
            </View>
            <ScrollView className="px-2 py-2">
              {VIDEO_LANGUAGES.map((option) => {
                const isSelected = option.code === value;
                return (
                  <Pressable
                    key={option.code}
                    onPress={() => handleSelect(option)}
                    className={`mx-2 my-1 px-4 py-3.5 rounded-2xl ${
                      isSelected ? 'bg-mint-light border border-mint' : 'bg-surface'
                    }`}
                  >
                    <Text
                      className={`text-base ${isSelected ? 'font-bold text-mint-dark' : 'text-ink'}`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View className="h-6" />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
