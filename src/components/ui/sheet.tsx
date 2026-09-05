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
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { Surface } from './surface';
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
      {/* Il foglio è un `Modal`, cioè una finestra a sé: la tastiera non lo
          ridimensiona come fa con il resto dell'app, e senza questo copre il
          campo che si sta compilando e i pulsanti sotto. */}
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.colors.scrim }]}
          onPress={onClose}
          accessibilityLabel="Chiudi"
        />

        {/* Il pannello non è incollato al bordo: galleggia, con lo stesso
            distacco delle barre. */}
        <Surface
          level="high"
          elevation="sheet"
          radius={theme.radius.xl}
          style={[
            styles.panel,
            {
              marginHorizontal: theme.floatInset,
              // L'area sicura la tiene il margine del pannello: chi sta dentro
              // non deve sommarla una seconda volta.
              marginBottom: Math.max(insets.bottom, theme.floatInset),
              paddingBottom: footer ? 0 : theme.space.md,
            },
          ]}>
          <View style={[styles.grabber, { backgroundColor: theme.colors.borderStrong }]} />

          {title ? (
            <View
              style={{
                paddingHorizontal: theme.space.lg,
                paddingBottom: theme.space.sm,
                gap: theme.space.xs,
                alignItems: 'center',
              }}>
              <Text variant="heading" style={styles.centered}>
                {title}
              </Text>
              {subtitle ? (
                <Text variant="caption" tone="dim" style={styles.centered}>
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
                  borderTopColor: theme.colors.border,
                  paddingHorizontal: theme.space.lg,
                  paddingVertical: theme.space.md,
                  gap: theme.space.sm,
                },
              ]}>
              {footer}
            </View>
          ) : null}
        </Surface>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * Voce di menu dentro un foglio: un'azione, una riga, area toccabile piena.
 *
 * Il contenuto è centrato come in ogni altra azione dell'app. Allineato a
 * sinistra sembrava sbilanciato, soprattutto accanto ai pulsanti del piede,
 * che invece sono centrati: nello stesso foglio convivevano due allineamenti.
 */
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
        <Surface
          level="low"
          radius={theme.radius.lg}
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
          <Text
            variant="subtitle"
            tone={destructive ? 'danger' : selected ? 'accent' : 'default'}
            style={styles.centered}>
            {label}
          </Text>
          {description ? (
            <Text variant="caption" tone="faint" style={styles.centered}>
              {description}
            </Text>
          ) : null}
        </Surface>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { flex: 1 },
  panel: { maxHeight: '85%' },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: 10 },
  scroll: { flexGrow: 0 },
  action: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  centered: { textAlign: 'center' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth * 2 },
});
