import { View, type ViewProps } from 'react-native';

interface ContentPanelProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

/** Flat content area inside the recipe detail sheet */
export function ContentPanel({ children, className = '', ...props }: ContentPanelProps) {
  return (
    <View className={`${className}`} {...props}>
      {children}
    </View>
  );
}
