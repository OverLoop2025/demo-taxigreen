import { Pressable, Text, View } from 'react-native';

type NumPadProps = {
  value: string;
  onChange: (nextValue: string) => void;
  maxLength?: number;
  disabled?: boolean;
};

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'blank', '0', 'delete'];

export function NumPad({ value, onChange, maxLength = 4, disabled }: NumPadProps) {
  function press(key: string) {
    if (disabled || key === 'blank') return;
    if (key === 'delete') {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length < maxLength) {
      onChange(`${value}${key}`);
    }
  }

  return (
    <View className="mt-5 flex-row flex-wrap justify-between gap-y-3">
      {keys.map((key, index) => {
        const blank = key === 'blank';
        return (
          <Pressable
            key={`${key}-${index}`}
            accessibilityRole={blank ? undefined : 'button'}
            disabled={disabled || blank}
            onPress={() => press(key)}
            className={`h-16 w-[31%] items-center justify-center rounded-lg border ${
              blank ? 'border-transparent bg-transparent' : 'border-gray-200 bg-white'
            }`}
          >
            <Text className="text-2xl font-bold text-product-deep">{key === 'delete' ? 'Borrar' : blank ? '' : key}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
