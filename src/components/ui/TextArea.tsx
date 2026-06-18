import { TextInput, View, Text, type TextInputProps } from 'react-native';

interface TextAreaProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
}

/** Multiline text input for longer content such as manual transcripts */
export function TextArea({ label, hint, error, className = '', ...props }: TextAreaProps) {
  return (
    <View className="w-full">
      {label ? <Text className="text-sm font-semibold text-ink mb-2">{label}</Text> : null}
      {hint ? <Text className="text-xs text-muted mb-2 leading-4">{hint}</Text> : null}
      <TextInput
        className={`bg-surface rounded-2xl px-5 py-4 text-base text-ink min-h-[120px] ${
          error ? 'border border-red-400' : ''
        } ${className}`}
        placeholderTextColor="#8E8E93"
        multiline
        textAlignVertical="top"
        autoCapitalize="sentences"
        autoCorrect={false}
        {...props}
      />
      {error ? <Text className="text-error-text text-sm mt-1.5">{error}</Text> : null}
    </View>
  );
}
