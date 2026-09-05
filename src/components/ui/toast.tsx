/**
 * Avviso effimero in cima allo schermo.
 *
 * Serve soprattutto ai record: quando si spunta una serie che è un primato,
 * dirlo subito è metà del valore della funzione. Un `Alert` interromperebbe
 * l'allenamento, questo no.
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { useTheme } from '@/theme';
import { Surface } from './surface';
import { Text } from './text';

type ToastTone = 'info' | 'record';

type ToastState = {
  message: string | null;
  detail: string | null;
  tone: ToastTone;
  show: (message: string, options?: { detail?: string; tone?: ToastTone }) => void;
  hide: () => void;
};

export const useToast = create<ToastState>((set) => ({
  message: null,
  detail: null,
  tone: 'info',
  show: (message, options) =>
    set({ message, detail: options?.detail ?? null, tone: options?.tone ?? 'info' }),
  hide: () => set({ message: null, detail: null }),
}));

const VISIBLE_MS = 3200;

export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { message, detail, tone, hide } = useToast();

  // `Animated` di React Native, non Reanimated: qui basta una dissolvenza e
  // non vale la pena essere i primi in questo progetto a dipendere dai worklet.
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    const timeout = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) hide();
      });
    }, VISIBLE_MS);
    return () => clearTimeout(timeout);
  }, [message, detail, hide, progress]);

  if (!message) return null;

  const isRecord = tone === 'record';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.root,
        {
          top: insets.top + theme.floatInset,
          marginHorizontal: theme.floatInset,
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }),
            },
          ],
        },
      ]}>
      <Surface
        level="high"
        elevation="float"
        radius={theme.radius.xl}
        style={[
          styles.body,
          {
            padding: theme.space.md,
            gap: theme.space.md,
            // Il record si annuncia con il proprio colore anche sul bordo:
            // è l'unico avviso che vale la pena guardare a metà serie.
            borderColor: isRecord ? theme.colors.record : theme.colors.borderStrong,
          },
        ]}>
        <MaterialCommunityIcons
          name={isRecord ? 'trophy' : 'information-outline'}
          size={22}
          color={isRecord ? theme.colors.record : theme.colors.textDim}
        />
        <Animated.View style={{ flex: 1, gap: 2 }}>
          <Text variant="subtitle" tone={isRecord ? 'record' : 'default'}>
            {message}
          </Text>
          {detail ? (
            <Text variant="caption" tone="dim">
              {detail}
            </Text>
          ) : null}
        </Animated.View>
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 0, right: 0, zIndex: 100 },
  body: { flexDirection: 'row', alignItems: 'center' },
});
