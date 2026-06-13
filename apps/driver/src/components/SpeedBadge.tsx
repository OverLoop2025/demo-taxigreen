import { Text, View } from 'react-native';

// Velocímetro circular estilo navegador: muestra la velocidad real del vehículo
// (GPS, m/s → km/h). En reposo o sin lectura confiable muestra "--". Pensado para
// el modo conductor, glanceable al volante.
export function SpeedBadge({ speedMs }: { speedMs: number | null }) {
  const kmh =
    typeof speedMs === 'number' && Number.isFinite(speedMs) && speedMs > 0.3
      ? Math.round(speedMs * 3.6)
      : null;

  return (
    <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-white/15 bg-ink-900/95 shadow-2xl">
      <Text className="text-2xl font-black leading-7 text-white">{kmh ?? '--'}</Text>
      <Text className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">km/h</Text>
    </View>
  );
}
