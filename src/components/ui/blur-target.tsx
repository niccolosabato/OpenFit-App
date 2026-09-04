/**
 * Il bersaglio del blur.
 *
 * Su Android il blur di `expo-blur` non è un filtro che una vista applica a
 * ciò che ha dietro: è un rapporto fra due viste. Il contenuto da sfocare va
 * avvolto in un `BlurTargetView`, e il suo `ref` va passato alla `BlurView`
 * che lo sovrasta. Senza quel ref la `BlurView` resta un rettangolo semitrasparente.
 *
 * Da qui discendono i due limiti che governano tutto il design in vetro:
 *
 * 1. Si può sfocare solo il *chrome fisso sovrapposto* al contenuto che scorre
 *    (tab bar, header, barre di azioni). Una card dentro una lista dovrebbe
 *    sfocare il proprio genitore, che la contiene: è un riferimento circolare.
 * 2. **Il rapporto non attraversa i confini di un `Modal`** (expo/expo#44165),
 *    quindi dentro i fogli il blur non funziona e si usa il vetro simulato.
 *
 * Il modulo si carica in modo pigro e protetto per la stessa ragione di
 * `features/timer/local-notifications.ts`: se un giorno non fosse disponibile,
 * l'app deve perdere una sfocatura, non avviarsi.
 */

import { createContext, useContext, useRef, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

type BlurModule = typeof import('expo-blur');

/** `undefined` = mai tentato, `null` = tentato e non disponibile. */
let cached: BlurModule | null | undefined;

/** Il modulo del blur, o `null` se questo runtime non ce l'ha. */
export function loadBlur(): BlurModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-blur') as BlurModule;
  } catch {
    cached = null;
  }
  return cached;
}

export const BLUR_AVAILABLE = () => loadBlur() !== null;

type BlurTargetRef = React.RefObject<View | null> | null;

const BlurTargetContext = createContext<BlurTargetRef>(null);

/**
 * Avvolge il contenuto che il chrome dovrà sfocare ed espone il suo ref.
 *
 * Va messo il più in alto possibile ma *sotto* il chrome: nel layout delle tab
 * avvolge le schermate, non la tab bar, altrimenti la barra sfocherebbe sé stessa.
 */
export function BlurTargetProvider({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const ref = useRef<View | null>(null);
  const blur = loadBlur();

  if (!blur) {
    return (
      <BlurTargetContext.Provider value={null}>
        <View style={style}>{children}</View>
      </BlurTargetContext.Provider>
    );
  }

  const { BlurTargetView } = blur;

  return (
    <BlurTargetContext.Provider value={ref}>
      <BlurTargetView ref={ref} style={style}>
        {children}
      </BlurTargetView>
    </BlurTargetContext.Provider>
  );
}

/**
 * Il bersaglio da passare a una `BlurView`, o `null` se qui il blur non è
 * possibile — fuori da un provider, o dentro un `Modal`. Chi lo consuma deve
 * saper ricadere sul vetro simulato.
 */
export function useBlurTarget(): BlurTargetRef {
  return useContext(BlurTargetContext);
}
