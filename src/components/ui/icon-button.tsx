/**
 * Bottone con la sola icona, con un'area toccabile onesta.
 *
 * Nasce da un conto fatto sull'app esistente: le azioni dell'header erano
 * 38×38, la stella dei preferiti un'icona da 22 con `hitSlop`, il menu delle
 * card di sessione 22px, il "riduci" della sessione un chevron nudo. Tutti
 * sotto i 48dp che il progetto si è dato per ciò che si tocca con le mani
 * sudate. Qui il bersaglio è 48 per costruzione e non si può sbagliare.
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet } from 'react-native';

import { capsule, useTheme } from '@/theme';
import { Surface } from './surface';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type IconButtonTone = 'default' | 'dim' | 'accent' | 'danger';

export function IconButton({
  icon,
  label,
  onPress,
  onLongPress,
  /** Dimensione del glifo. L'area toccabile resta 48 comunque. */
  size = 22,
  tone = 'default',
  /** Disegna la superficie sotto l'icona: serve a farla trovare. */
  surface = false,
  /** Tinge d'accento: lo stato attivo. */
  active = false,
  disabled = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  onLongPress?: () => void;
  size?: number;
  tone?: IconButtonTone;
  surface?: boolean;
  active?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();

  const color = {
    default: theme.colors.text,
    dim: theme.colors.textDim,
    accent: theme.colors.accent,
    danger: theme.colors.danger,
  }[active ? 'accent' : tone];

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      style={disabled && styles.disabled}>
      {({ pressed }) =>
        surface ? (
          <Surface
            level="mid"
            radius={capsule(HIT_TARGET)}
            tinted={active}
            pressed={pressed}
            style={styles.box}>
            <MaterialCommunityIcons name={icon} size={size} color={color} />
          </Surface>
        ) : (
          <MaterialCommunityIcons
            name={icon}
            size={size}
            color={color}
            style={[styles.bare, pressed && styles.pressed]}
          />
        )
      }
    </Pressable>
  );
}

/** Il bersaglio: 48 in ogni direzione, e il raggio ne è la metà. */
const HIT_TARGET = 48;

const styles = StyleSheet.create({
  /** 48×48: la soglia sotto cui non si scende. */
  box: { width: HIT_TARGET, height: HIT_TARGET, alignItems: 'center', justifyContent: 'center' },
  bare: {
    width: 48,
    height: 48,
    lineHeight: 48,
    textAlign: 'center',
  },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.4 },
});
