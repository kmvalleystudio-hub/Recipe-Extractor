import { TextInput, View, Text, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <View className="w-full">
      {label ? <Text className="text-sm font-semibold text-ink mb-2">{label}</Text> : null}
      <TextInput
        className={`bg-surface rounded-2xl px-5 py-4 text-base text-ink ${
          error ? 'border border-red-400' : ''
        } ${className}`}
        placeholderTextColor="#8E8E93"
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
      {error ? <Text className="text-error-text text-sm mt-1.5">{error}</Text> : null}
    </View>
  );
}
