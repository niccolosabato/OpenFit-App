/**
 * L'alone d'accento che si posa su una superficie.
 *
 * Serve a distinguere l'unica card che conta — quella dell'allenamento di
 * oggi, il riquadro del recupero — dalle altre venti che le stanno intorno,
 * senza ricorrere a un fondo pieno d'accento, che a schermo intero è
 * accecante, né a un bordo colorato, che a quel punto ce l'avrebbero tutte.
 *
 * È un figlio in posizione assoluta e non un fondo: cambiare il
 * `backgroundColor` di una vista arrotondata su Android le fa perdere il
 * raggio. Va dentro una `Surface`, che con `overflow: 'hidden'` lo ritaglia
 * sulla forma giusta.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/theme';

export function AccentWash({
  /** Quanto è intenso l'alone dove è più forte. */
  intensity = 'soft',
}: {
  intensity?: 'soft' | 'strong';
}) {
  const theme = useTheme();

  return (
    <LinearGradient
      pointerEvents="none"
      colors={[
        intensity === 'strong' ? theme.colors.accentGlow : theme.colors.accentHalo,
        'transparent',
      ]}
      // Dall'angolo in alto a destra verso il basso a sinistra: la luce entra
      // dall'alto, come in ogni altra ombra dell'app.
      start={{ x: 1, y: 0 }}
      end={{ x: 0.1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}
