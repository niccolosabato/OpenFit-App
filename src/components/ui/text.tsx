/**
 * Testo tematizzato.
 *
 * Esiste per due motivi: i colori arrivano dal tema invece che a mano, e la
 * variante `numeric` usa cifre a larghezza fissa — senza, le colonne di
 * carichi e ripetizioni ballano a ogni tasto premuto durante una serie.
 */

import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/theme';

export type TextVariant =
  /** Numeri grandi: timer, volume totale, carico di una top set. */
  | 'display'
  /** Titolo di schermata. */
  | 'title'
  /** Titolo di sezione o di card. */
  | 'heading'
  /** Nome di un esercizio in lista. */
  | 'subtitle'
  /** Testo corrente. */
  | 'body'
  /** Metadati, unità, didascalie. */
  | 'caption'
  /** Etichette di colonna, tutto maiuscolo. */
  | 'label';

export type TextTone =
  | 'default'
  | 'dim'
  | 'faint'
  | 'accent'
  | 'danger'
  | 'warning'
  | 'success'
  | 'record'
  | 'onAccent';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  /** Cifre a larghezza fissa: obbligatorio per tutto ciò che è tabellare. */
  numeric?: boolean;
};

export function Text({ variant = 'body', tone = 'default', numeric, style, ...rest }: TextProps) {
  const theme = useTheme();

  const toneColor: Record<TextTone, string> = {
    default: theme.colors.text,
    dim: theme.colors.textDim,
    faint: theme.colors.textFaint,
    accent: theme.colors.accent,
    danger: theme.colors.danger,
    warning: theme.colors.warning,
    success: theme.colors.success,
    record: theme.colors.record,
    onAccent: theme.colors.onAccent,
  };

  const variantStyle: Record<TextVariant, object> = {
    display: { fontSize: theme.font.size.display, fontWeight: '800', letterSpacing: -0.5 },
    title: { fontSize: theme.font.size.xxl, fontWeight: '700', letterSpacing: -0.3 },
    heading: { fontSize: theme.font.size.lg, fontWeight: '700' },
    subtitle: { fontSize: theme.font.size.md, fontWeight: '600' },
    body: { fontSize: theme.font.size.md, fontWeight: '400' },
    caption: { fontSize: theme.font.size.sm, fontWeight: '400' },
    label: { fontSize: theme.font.size.xs, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  };

  return (
    <RNText
      style={[
        styles.base,
        variantStyle[variant],
        { color: toneColor[tone] },
        numeric && { fontVariant: ['tabular-nums'] },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
