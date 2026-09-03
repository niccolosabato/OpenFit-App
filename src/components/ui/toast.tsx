/**
 * Avviso effimero in cima allo schermo.
 *
 * Serve soprattutto ai record: quando si spunta una serie che è un primato,
 * dirlo subito è metà del valore della funzione. Un `Alert` interromperebbe
 * l'allenamento, questo no.
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { useTheme } from '@/theme';
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

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(hide, VISIBLE_MS);
    return () => clearTimeout(timeout);
  }, [message, detail, hide]);

  if (!message) return null;

  const isRecord = tone === 'record';

  return (
    <View
      pointerEvents="none"
      style={[
        styles.root,
        {
          top: insets.top + theme.space.sm,
          marginHorizontal: theme.space.lg,
          padding: theme.space.md,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface3,
          borderColor: isRecord ? theme.colors.record : theme.colors.borderStrong,
          gap: theme.space.md,
        },
      ]}>
      <MaterialCommunityIcons
        name={isRecord ? 'trophy' : 'information-outline'}
        size={22}
        color={isRecord ? theme.colors.record : theme.colors.textDim}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="subtitle" tone={isRecord ? 'record' : 'default'}>
          {message}
        </Text>
        {detail ? (
          <Text variant="caption" tone="dim">
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    zIndex: 100,
  },
});
