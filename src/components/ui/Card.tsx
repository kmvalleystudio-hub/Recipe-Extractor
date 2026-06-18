import { View, Text, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <View
      className={`rounded-3xl bg-white p-5 shadow-soft border border-gray-100 ${className}`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
      }}
      {...props}
    >
      {children}
    </View>
  );
}

interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <View className="mb-4">
      <Text className="text-lg font-bold text-ink">{title}</Text>
      {subtitle ? <Text className="text-sm text-muted mt-1">{subtitle}</Text> : null}
    </View>
  );
}

interface NotIndicatedBadgeProps {
  text?: string;
}

export function NotIndicatedBadge({ text = 'not indicated' }: NotIndicatedBadgeProps) {
  return (
    <View className="bg-peach-light border border-peach/40 rounded-xl px-3 py-1.5 self-start">
      <Text className="text-xs font-medium text-peach-dark">{text}</Text>
    </View>
  );
}

interface SuggestionBoxProps {
  label: string;
  value: string;
  reason?: string;
}

export function SuggestionBox({ label, value, reason }: SuggestionBoxProps) {
  if (!value || value.trim().toLowerCase() === 'not indicated') return null;

  return (
    <View className="bg-sky-light rounded-2xl p-3 mt-2">
      <Text className="text-xs font-semibold text-sky-dark uppercase tracking-wide">
        Smart suggestion
      </Text>
      <Text className="text-sm font-medium text-ink mt-1">
        {label}: {value}
      </Text>
      {reason ? <Text className="text-xs text-muted mt-1">{reason}</Text> : null}
    </View>
  );
}

interface DisclaimerProps {
  className?: string;
}

export function Disclaimer({ className = '' }: DisclaimerProps) {
  return (
    <Text className={`text-xs text-muted leading-5 ${className}`}>
      Suggestions are estimates based on common cooking ratios. Please adjust to taste and
      dietary needs.
    </Text>
  );
}
