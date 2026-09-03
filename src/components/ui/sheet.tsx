/**
 * Foglio che sale dal basso.
 *
 * Costruito su `Modal` invece che su una libreria di bottom sheet: qui serve
 * solo un pannello che compare, e restare senza dipendenze significa una cosa
 * in meno che si rompe agli aggiornamenti di Reanimated.
 *
 * Il contenuto sta in basso perché è dove arriva il pollice: durante una serie
 * si tiene il telefono con una mano sola.
 */

import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { Text } from './text';

export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  /** Il contenuto scorre: usarlo per elenchi lunghi (tipi di set, muscoli). */
  scrollable = true,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scrollable?: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const body = (
    <View style={{ padding: theme.space.lg, gap: theme.space.md }}>{children}</View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Chiudi" />
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderStrong,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            paddingBottom: insets.bottom + theme.space.md,
          },
        ]}>
        <View style={[styles.grabber, { backgroundColor: theme.colors.borderStrong }]} />

        {title ? (
          <View style={{ paddingHorizontal: theme.space.lg, paddingBottom: theme.space.sm, gap: 2 }}>
            <Text variant="heading">{title}</Text>
            {subtitle ? (
              <Text variant="caption" tone="dim">
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}

        {scrollable ? (
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
            {body}
          </ScrollView>
        ) : (
          body
        )}
      </View>
    </Modal>
  );
}

/** Voce di menu dentro un foglio: un'azione, una riga, area toccabile piena. */
export function SheetAction({
  label,
  description,
  onPress,
  destructive,
  selected,
}: {
  label: string;
  description?: string;
  onPress: () => void;
  destructive?: boolean;
  selected?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      style={({ pressed }) => [
        styles.action,
        {
          minHeight: theme.hit,
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.sm,
          borderRadius: theme.radius.md,
          backgroundColor: selected ? theme.colors.accentGlow : 'transparent',
          borderColor: selected ? theme.colors.accent : theme.colors.border,
        },
        pressed && { backgroundColor: theme.colors.surface2 },
      ]}>
      <Text variant="subtitle" tone={destructive ? 'danger' : selected ? 'accent' : 'default'}>
        {label}
      </Text>
      {description ? (
        <Text variant="caption" tone="faint">
          {description}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  panel: {
    maxHeight: '85%',
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderLeftWidth: StyleSheet.hairlineWidth * 2,
    borderRightWidth: StyleSheet.hairlineWidth * 2,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: 10 },
  scroll: { flexGrow: 0 },
  action: { justifyContent: 'center', gap: 2, borderWidth: StyleSheet.hairlineWidth * 2 },
});
