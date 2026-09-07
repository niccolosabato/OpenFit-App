/**
 * Fascia flottante: il guscio comune a tutto ciò che sta sopra il contenuto
 * invece che nel flusso — header, barra delle azioni, tab bar, barra
 * dell'allenamento in corso.
 *
 * Sono tre strati: una fascia opaca del colore del fondo (copre il contenuto
 * che scorre sotto), dentro una `Surface` arrotondata staccata dai bordi di
 * `theme.floatInset`, e **una sfumatura sul lato interno**. Quest'ultima è la
 * differenza fra una barra e un taglio: senza, il contenuto che scorre
 * spariva di netto contro il bordo della fascia, e si vedeva la cucitura fra
 * i due sistemi.
 *
 * La sfumatura sta nel flusso e non in posizione assoluta: `Screen` misura
 * l'altezza della banda per dire allo scroll quanto spazio lasciare, e una
 * sfumatura fuori dal flusso non verrebbe contata — il contenuto partirebbe
 * sotto di essa, cioè già sbiadito. Con `pointerEvents="box-none"` la sua
 * fascia resta comunque attraversabile dal dito.
 */

import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { Surface } from './surface';

/** Quanto è alta la dissolvenza fra la fascia e il contenuto che le scorre sotto. */
const FADE = 20;

export function FloatingBand({
  children,
  edge,
  /**
   * Solo per `edge: 'bottom'`. `'safe'` tiene conto del bordo del telefono
   * (fondo schermo). `'fixed'` lo ignora perché sotto c'è già un altro
   * chrome che se ne occupa (due bande vicine sommerebbero l'area sicura
   * due volte). `'none'` azzera il padding: la banda è impilata a contatto
   * con un'altra sotto di sé, come la barra dell'allenamento sopra la tab
   * bar — un padding proprio raddoppierebbe lo spacing tra le due.
   */
  bottomInset = 'safe',
  tinted = false,
  /**
   * La sfumatura verso il contenuto.
   *
   * Va spenta su tutte le bande impilate tranne quella più esterna: fra due
   * bande la sfumatura non ha contenuto da sfumare e aprirebbe una fessura
   * trasparente di venti punti in mezzo a due barre opache.
   */
  fade = true,
  onPress,
  accessibilityLabel,
  surfaceStyle,
  style,
}: {
  children: ReactNode;
  edge: 'top' | 'bottom';
  bottomInset?: 'safe' | 'fixed' | 'none';
  tinted?: boolean;
  fade?: boolean;
  /** Se presente, l'intera banda diventa un unico bersaglio toccabile. */
  onPress?: () => void;
  accessibilityLabel?: string;
  surfaceStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const edgePadding: ViewStyle =
    edge === 'top'
      ? { paddingTop: insets.top + theme.space.sm, paddingBottom: theme.space.sm }
      : {
          paddingTop: theme.space.sm,
          paddingBottom:
            bottomInset === 'safe'
              ? Math.max(insets.bottom, theme.floatInset)
              : bottomInset === 'fixed'
                ? theme.floatInset
                : 0,
        };

  const surface = (pressed: boolean) => (
    <Surface
      level="low"
      elevation="float"
      radius={theme.radius.xxl}
      tinted={tinted}
      pressed={pressed}
      style={surfaceStyle}>
      {children}
    </Surface>
  );

  const band = (
    <View
      style={[
        { backgroundColor: theme.colors.bg, paddingHorizontal: theme.floatInset },
        edgePadding,
      ]}>
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
          {({ pressed }) => surface(pressed)}
        </Pressable>
      ) : (
        surface(false)
      )}
    </View>
  );

  const dissolve = fade ? (
    <LinearGradient
      pointerEvents="none"
      colors={edge === 'top' ? [theme.colors.bg, 'transparent'] : ['transparent', theme.colors.bg]}
      style={{ height: FADE }}
    />
  ) : null;

  return (
    // `box-none`: la banda occupa anche la striscia sfumata, dove non c'è
    // niente da toccare e il dito deve arrivare al contenuto sotto.
    <View pointerEvents="box-none" style={style}>
      {edge === 'top' ? band : dissolve}
      {edge === 'top' ? dissolve : band}
    </View>
  );
}
