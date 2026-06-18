import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  className?: string;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const base = 'rounded-3xl py-4 px-6 items-center justify-center flex-row';
  const variants = {
    primary: 'bg-mint active:bg-mint-dark',
    secondary: 'bg-peach active:opacity-90',
    outline: 'bg-transparent border-2 border-mint',
  };
  const textVariants = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-mint-dark',
  };

  return (
    <Pressable
      className={`${base} ${variants[variant]} ${disabled || loading ? 'opacity-50' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#4A9B73' : '#FFFFFF'} />
      ) : (
        <Text className={`font-bold text-base ${textVariants[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
}
