import { Pressable, Text, View } from 'react-native';
import { useThemePref, type ThemePref } from '@/features/theme/theme-provider';

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

/** Selector discreto de apariencia. Vive en Perfil para no robar protagonismo. */
export function ThemeControl() {
  const { pref, setPref } = useThemePref();

  return (
    <View>
      <Text className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Apariencia</Text>
      <View className="mt-2 flex-row gap-1 rounded-2xl border border-border bg-surface-muted p-1">
        {OPTIONS.map((option) => {
          const active = pref === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setPref(option.value)}
              className={`flex-1 items-center rounded-xl px-3 py-2 ${active ? 'bg-brand' : ''}`}
            >
              <Text className={`text-sm font-bold ${active ? 'text-ink-900' : 'text-foreground-muted'}`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
