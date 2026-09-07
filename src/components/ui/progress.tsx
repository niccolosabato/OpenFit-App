/**
 * Avanzamento: una barra e un anello.
 *
 * L'app conta sempre qualcosa su qualcos'altro — serie fatte su previste,
 * allenamenti su obiettivo settimanale, secondi di recupero rimasti — e finora
 * lo diceva solo a parole ("3/4"). Una forma che si riempie si legge con la
 * coda dell'occhio, che durante una seduta è l'unico sguardo disponibile.
 *
 * Entrambi si animano verso il valore nuovo invece di saltarci: il salto fa
 * sembrare che il dato sia cambiato da solo, il movimento che sia stato il
 * gesto appena fatto a cambiarlo.
 */

import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { capsule, useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Tiene il valore nel dominio [0, 1]: i conti a monte a volte sforano. */
function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function ProgressBar({
  /** Da 0 a 1. Oltre 1 resta pieno. */
  value,
  height = 6,
  color,
  trackColor,
  style,
}: {
  value: number;
  height?: number;
  color?: string;
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const progress = useSharedValue(clamp(value));

  useEffect(() => {
    progress.value = withSpring(clamp(value), theme.motion.springSoft);
  }, [value, progress, theme.motion.springSoft]);

  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View
      style={[
        {
          height,
          borderRadius: capsule(height),
          backgroundColor: trackColor ?? theme.colors.surface3,
          overflow: 'hidden',
        },
        style,
      ]}>
      <Animated.View
        style={[
          fill,
          {
            height: '100%',
            borderRadius: capsule(height),
            backgroundColor: color ?? theme.colors.accent,
          },
        ]}
      />
    </View>
  );
}

/**
 * Anello di avanzamento.
 *
 * Parte da mezzogiorno e gira in senso orario, come ogni quadrante: si ottiene
 * ruotando l'SVG di -90°, perché un cerchio SVG comincia a ore tre.
 */
export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  color,
  trackColor,
  children,
  style,
}: {
  /** Da 0 a 1. Oltre 1 resta pieno. */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  /** Cosa sta nel buco dell'anello: di norma il numero che l'anello illustra. */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(clamp(value));

  useEffect(() => {
    progress.value = withSpring(clamp(value), theme.motion.springSoft);
  }, [value, progress, theme.motion.springSoft]);

  const animated = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} style={styles.rotated}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor ?? theme.colors.surface3}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color ?? theme.colors.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animated}
          fill="none"
        />
      </Svg>
      {children ? <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Un cerchio SVG comincia a ore tre: ruotando il disegno l'anello parte da
  // mezzogiorno, che è da dove ci si aspetta che parta.
  rotated: { transform: [{ rotate: '-90deg' }] },
  center: { alignItems: 'center', justifyContent: 'center' },
});
