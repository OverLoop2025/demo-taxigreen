import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type TouchButtonProps = PressableProps & {
  label: string;
  tone?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
};

function toneClass(tone: TouchButtonProps['tone'], disabled?: boolean) {
  if (disabled) return 'bg-gray-200 border-gray-200';
  if (tone === 'secondary') return 'bg-white border-product';
  if (tone === 'danger') return 'bg-red-600 border-red-600';
  if (tone === 'ghost') return 'bg-transparent border-transparent';
  return 'bg-product border-product';
}

function labelClass(tone: TouchButtonProps['tone'], disabled?: boolean) {
  if (disabled) return 'text-gray-500';
  if (tone === 'secondary' || tone === 'ghost') return 'text-product';
  return 'text-white';
}

export function TouchButton({ label, tone = 'primary', loading, disabled, className = '', ...props }: TouchButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`min-h-16 items-center justify-center rounded-lg border px-5 ${toneClass(tone, isDisabled)} ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={tone === 'secondary' ? '#227FDE' : '#FFFFFF'} />
      ) : (
        <Text className={`text-center text-lg font-bold ${labelClass(tone, isDisabled)}`}>{label}</Text>
      )}
    </Pressable>
  );
}
