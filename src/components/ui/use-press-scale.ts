import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { motion } from '@/theme';

/**
 * Rimpicciolisce di poco un bersaglio alla pressione, oltre al cambio di
 * opacità già usato ovunque. Solo su `Button` e `Card`: sono i bersagli più
 * grandi e più toccati, dove uno scale-down si vede — non vale per icone o
 * righe strette, dove sarebbe impercettibile.
 *
 * Andata a tempo, ritorno a molla: schiacciare deve essere immediato, il
 * rilascio è la parte che si guarda e vuole avere un peso.
 */
export function usePressScale() {
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return {
    style,
    onPressIn: () => {
      scale.value = withTiming(motion.pressScale, { duration: motion.duration.fast });
    },
    onPressOut: () => {
      scale.value = withSpring(1, motion.spring);
    },
  };
}
