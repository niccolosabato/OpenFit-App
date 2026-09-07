/**
 * Testo tematizzato.
 *
 * Fa tre cose che a mano si sbaglierebbero ogni volta: prende il colore dal
 * tema, sceglie **la famiglia giusta per il peso** — con caratteri caricati a
 * file separati, `fontWeight` su Android non sceglie il file, lo *simula*
 * ingrassando i contorni — e tiene le cifre a larghezza fissa dove il testo è
 * tabellare, così le colonne di carichi e ripetizioni non ballano a ogni tasto
 * premuto durante una serie.
 */

import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';

import { family, font, useTheme } from '@/theme';

export type TextVariant =
  /** Numeri che *sono* il contenuto: countdown, volume totale, contatori. */
  | 'display'
  /** Titolo di schermata. */
  | 'title'
  /** Titolo di sezione o di card. */
  | 'heading'
  /** Valore numerico di media grandezza: le statistiche di una seduta. */
  | 'metric'
  /** Nome di un esercizio in lista, etichetta di un bottone. */
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

/**
 * Il peso, come nome e non come numero.
 *
 * Con i caratteri caricati a file separati `fontWeight` non sceglie il file:
 * su Android lo *simula*, ingrassando i contorni di quello che c'è. Questo
 * prop sceglie il file giusto, ed è l'unico modo corretto di irrobustire un
 * testo — `style={{ fontWeight: '600' }}` è sempre un errore.
 */
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  /** Sovrascrive il peso della variante. */
  weight?: TextWeight;
  /**
   * Cifre a larghezza fissa: obbligatorio per tutto ciò che è tabellare.
   * Le varianti grandi lo sono già — Space Grotesk ha le cifre monospaziate
   * per costruzione — quindi lì non cambia nulla.
   */
  numeric?: boolean;
};

/**
 * Le varianti, come stili completi.
 *
 * Sono fuori dal componente perché non dipendono dal tema: corpo, famiglia e
 * crenatura di un titolo sono gli stessi con qualunque accento, e ricostruirli
 * a ogni render era lavoro buttato.
 */
const VARIANT = {
  display: {
    fontFamily: family.displayBold,
    fontSize: font.size.display,
    letterSpacing: font.tracking.display,
  },
  title: {
    fontFamily: family.displayBold,
    fontSize: font.size.xxl,
    letterSpacing: font.tracking.title,
  },
  metric: {
    fontFamily: family.displayBold,
    fontSize: font.size.xl,
    letterSpacing: font.tracking.heading,
  },
  heading: {
    fontFamily: family.bold,
    fontSize: font.size.lg,
    letterSpacing: font.tracking.heading,
  },
  subtitle: {
    fontFamily: family.semibold,
    fontSize: font.size.md,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: family.regular,
    fontSize: font.size.md,
    letterSpacing: font.tracking.body,
  },
  caption: {
    fontFamily: family.regular,
    fontSize: font.size.sm,
    letterSpacing: font.tracking.body,
  },
  label: {
    fontFamily: family.semibold,
    fontSize: font.size.xs,
    letterSpacing: font.tracking.label,
    textTransform: 'uppercase',
  },
} as const satisfies Record<TextVariant, object>;

/** Le varianti che usano già cifre monospaziate: `numeric` lì è superfluo. */
const ALREADY_TABULAR: TextVariant[] = ['display', 'title', 'metric'];

/** I file, per peso. Le varianti grandi restano su Space Grotesk. */
const WEIGHT_FAMILY: Record<TextWeight, string> = {
  regular: family.regular,
  medium: family.medium,
  semibold: family.semibold,
  bold: family.bold,
};

const DISPLAY_WEIGHT_FAMILY: Record<TextWeight, string> = {
  regular: family.display,
  medium: family.display,
  semibold: family.displayBold,
  bold: family.displayBold,
};

export function Text({
  variant = 'body',
  tone = 'default',
  weight,
  numeric,
  style,
  ...rest
}: TextProps) {
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

  return (
    <RNText
      style={[
        styles.base,
        VARIANT[variant],
        weight && {
          fontFamily: (ALREADY_TABULAR.includes(variant) ? DISPLAY_WEIGHT_FAMILY : WEIGHT_FAMILY)[
            weight
          ],
        },
        { color: toneColor[tone] },
        numeric && !ALREADY_TABULAR.includes(variant) && styles.tabular,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  /**
   * `includeFontPadding: false` toglie il padding che il font si porta dietro,
   * ma su Android da solo scentra il testo in verticale: dentro un contenitore
   * centrato le scritte finiscono un po' più in alto del centro vero. Serve
   * dirgli esplicitamente di centrarsi.
   */
  base: { includeFontPadding: false, textAlignVertical: 'center' },
  tabular: { fontVariant: ['tabular-nums'] },
});

/**
 * Lo stile tipografico di una variante, per chi non può usare `<Text>`.
 *
 * Serve ai `TextInput`, che sono componenti di React Native e non possono
 * essere avvolti: senza questo ognuno si sceglieva famiglia e corpo a mano, e
 * il carico digitato in una serie usciva con un carattere diverso da quello
 * con cui veniva riletto un secondo dopo.
 */
export function typography(variant: TextVariant) {
  return { ...VARIANT[variant], includeFontPadding: false } as const;
}
