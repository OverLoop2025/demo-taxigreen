import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type DraggableSheetProps = {
  children: ReactNode;
  /** Clases de la tarjeta visible (fondo, bordes, padding). */
  cardClassName: string;
  /** Estilo del contenedor animado (p. ej. posición absoluta del sheet). */
  containerStyle?: ViewStyle;
  /** Soltar tras arrastrar hacia arriba más allá del umbral. */
  onSwipeUp?: () => void;
  /** Soltar tras arrastrar hacia abajo más allá del umbral. */
  onSwipeDown?: () => void;
  /** Tap simple sobre el asa (alterna estado). */
  onTap?: () => void;
  /** Topes del arrastre en px (arriba negativo, abajo positivo). */
  dragUpLimit?: number;
  dragDownLimit?: number;
};

/**
 * Tarjeta inferior arrastrable con el dedo (sheet): sigue el gesto en tiempo real
 * y, al soltar, decide expandir/colapsar/cerrar según dirección y velocidad, con un
 * spring suave de retorno. El asa también acepta tap. Reemplaza el patrón
 * "tap-para-abrir" por uno verdaderamente deslizable y cómodo.
 */
export function DraggableSheet({
  children,
  cardClassName,
  containerStyle,
  onSwipeUp,
  onSwipeDown,
  onTap,
  dragUpLimit = -56,
  dragDownLimit = 160,
}: DraggableSheetProps) {
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(dragUpLimit, Math.min(dragDownLimit, event.translationY));
    })
    .onEnd((event) => {
      const subir = event.translationY < -28 || event.velocityY < -500;
      const bajar = event.translationY > 28 || event.velocityY > 500;
      if (subir && onSwipeUp) runOnJS(onSwipeUp)();
      else if (bajar && onSwipeDown) runOnJS(onSwipeDown)();
      translateY.value = withSpring(0, { damping: 20, stiffness: 200, mass: 0.6 });
    });

  const tap = Gesture.Tap().onEnd(() => {
    if (onTap) runOnJS(onTap)();
  });

  const gesture = Gesture.Exclusive(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <View className={cardClassName}>
        <GestureDetector gesture={gesture}>
          <View className="items-center pb-2 pt-1" accessibilityRole="adjustable">
            <View className="h-1.5 w-12 rounded-full bg-border" />
          </View>
        </GestureDetector>
        {children}
      </View>
    </Animated.View>
  );
}
