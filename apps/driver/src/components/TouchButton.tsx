import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type TouchButtonProps = PressableProps & {
  label: string;
  tone?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
};

function toneClass(tone: TouchButtonProps['tone'], disabled?: boolean) {
  if (disabled) return 'bg-ink-700 border-ink-line';
  if (tone === 'secondary') return 'bg-ink-700 border-brand';
  if (tone === 'danger') return 'bg-red-500 border-red-500';
  if (tone === 'ghost') return 'bg-transparent border-transparent';
  return 'bg-brand border-brand';
}

function labelClass(tone: TouchButtonProps['tone'], disabled?: boolean) {
  if (disabled) return 'text-zinc-500';
  if (tone === 'secondary' || tone === 'ghost') return 'text-brand';
  return 'text-ink-900';
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
        <ActivityIndicator color={tone === 'secondary' || tone === 'ghost' ? '#10B981' : '#0A0A0B'} />
      ) : (
        <Text className={`text-center text-lg font-bold ${labelClass(tone, isDisabled)}`}>{label}</Text>
      )}
    </Pressable>
  );
}
