/**
 * Foglio che sale dal basso.
 *
 * Costruito su `Modal` invece che su una libreria di bottom sheet: qui serve
 * solo un pannello che compare, e restare senza dipendenze significa una cosa
 * in meno che si rompe agli aggiornamenti di Reanimated.
 *
 * Il pannello usa il vetro *simulato*, non il blur: il rapporto fra `BlurView`
 * e `BlurTargetView` non attraversa i confini di un `Modal` (vedi
 * `blur-target.tsx`). Sul fondo scurito la differenza non si vede.
 *
 * Il contenuto sta in basso perché è dove arriva il pollice: durante una serie
 * si tiene il telefono con una mano sola.
 */

import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { Glass } from './glass';
import { Text } from './text';

export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  /** Il contenuto scorre: usarlo per elenchi lunghi (tipi di set, muscoli). */
  scrollable = true,
  /**
   * Piede fisso, fuori dallo scroll: ci va il "Salva" dei fogli lunghi.
   * Senza, in un foglio da dodici campi il pulsante di conferma va inseguito
   * scorrendo — che è esattamente il problema che questo redesign risolve.
   */
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scrollable?: boolean;
  footer?: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const body = <View style={{ padding: theme.space.lg, gap: theme.space.md }}>{children}</View>;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.glass.backdrop }]}
        onPress={onClose}
        accessibilityLabel="Chiudi"
      />
      <Glass
        level="high"
        elevation="high"
        radius={0}
        style={[
          styles.panel,
          {
            backgroundColor: theme.glass.panel,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            paddingBottom: footer ? 0 : insets.bottom + theme.space.md,
          },
        ]}>
        <View style={[styles.grabber, { backgroundColor: theme.glass.strokeTop }]} />

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

        {footer ? (
          <View
            style={[
              styles.footer,
              {
                borderTopColor: theme.glass.stroke,
                paddingHorizontal: theme.space.lg,
                paddingTop: theme.space.md,
                paddingBottom: insets.bottom + theme.space.md,
                gap: theme.space.sm,
              },
            ]}>
            {footer}
          </View>
        ) : null}
      </Glass>
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
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: Boolean(selected) }}>
      {({ pressed }) => (
        <Glass
          level={selected ? 'mid' : 'low'}
          radius={theme.radius.md}
          sheen={false}
          tinted={selected}
          danger={destructive}
          pressed={pressed}
          style={[
            styles.action,
            {
              minHeight: theme.hit,
              paddingHorizontal: theme.space.md,
              paddingVertical: theme.space.sm,
            },
          ]}>
          <Text variant="subtitle" tone={destructive ? 'danger' : selected ? 'accent' : 'default'}>
            {label}
          </Text>
          {description ? (
            <Text variant="caption" tone="faint">
              {description}
            </Text>
          ) : null}
        </Glass>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  panel: { maxHeight: '85%', borderBottomWidth: 0 },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: 10 },
  scroll: { flexGrow: 0 },
  action: { justifyContent: 'center', gap: 2 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth * 2 },
});
