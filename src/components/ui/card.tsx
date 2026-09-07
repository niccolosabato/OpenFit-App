import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme, type ElevationKey } from '@/theme';
import { AccentWash } from './accent-wash';
import { Surface, type SurfaceLevel } from './surface';
import { usePressScale } from './use-press-scale';

/**
 * Superficie standard: il contenitore di quasi tutto.
 * Se riceve `onPress` diventa toccabile e reagisce alla pressione.
 */
export function Card({
  children,
  onPress,
  onLongPress,
  style,
  padded = true,
  /** Vela la card con l'accento: usarla per ciò che è selezionato o in corso. */
  tinted = false,
  /**
   * L'alone d'accento in diagonale: la card *principale* di una schermata,
   * quella che si è venuti a toccare. Una sola per schermata, o non distingue
   * più niente.
   */
  wash = false,
  /** Di norma `low`: appoggiata sul fondo dell'app. Serve `mid` solo quando
   *  la card sta già dentro un `Surface level="low"` — es. le card di uno
   *  stesso superset, raccolte in un contenitore — altrimenti avrebbe lo
   *  stesso colore di ciò che la contiene e sparirebbe. */
  level = 'low',
  elevation = 'none',
  radius,
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  tinted?: boolean;
  wash?: boolean;
  level?: SurfaceLevel;
  elevation?: ElevationKey;
  radius?: number;
}) {
  const theme = useTheme();
  const press = usePressScale();

  const padding: ViewStyle = { padding: padded ? theme.space.lg : 0 };

  const body = (pressed: boolean) => (
    <Surface
      level={level}
      tinted={tinted}
      pressed={pressed}
      elevation={elevation}
      radius={radius}
      style={[padding, style]}>
      {wash ? <AccentWash /> : null}
      {children}
    </Surface>
  );

  if (!onPress && !onLongPress) return body(false);

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
      {({ pressed }) => <Animated.View style={press.style}>{body(pressed)}</Animated.View>}
    </Pressable>
  );
}
