import { Linking, Pressable, Text, View } from 'react-native';

/**
 * Crédito de autoría discreto, espejo del de la web (AuthorCredit). El nombre va
 * resaltado con el color de texto principal (se adapta a claro/oscuro) y el resto en
 * tono atenuado, para firmar el producto sin competir con la marca Taxi Green.
 */
export function AuthorCredit({ className }: { className?: string }) {
  return (
    <Pressable
      className={`items-center ${className ?? ''}`}
      onPress={() => void Linking.openURL('https://github.com/OverLoop2025')}
    >
      <View className="flex-row items-center">
        <Text className="text-xs text-foreground-muted">Developed by </Text>
        <Text className="text-xs font-semibold text-foreground">José Álvarez</Text>
      </View>
      <Text className="mt-0.5 text-xs text-foreground-muted">github.com/OverLoop2025 · 959 799 190</Text>
    </Pressable>
  );
}
