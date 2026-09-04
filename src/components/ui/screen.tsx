/**
 * Contenitore di schermata: fondo del tema, aree sicure e chrome fisso.
 *
 * Il vetro si vede solo se qualcosa gli scorre sotto. Per questo header e
 * barra delle azioni non stanno nel flusso ma *sopra* il contenuto, che passa
 * loro sotto e si intravede sfocato. Chi scorre non deve però finire con le
 * prime e le ultime righe nascoste: `Screen` misura il chrome e lo pubblica in
 * un contesto, e `ScreenScroll` lo trasforma nei margini giusti.
 *
 * Le schermate che non passano `header` né `actionBar` si comportano come
 * prima, con il contenuto nel flusso.
 */

import { createContext, useContext, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { BlurTargetProvider } from './blur-target';

export type ScreenChrome = {
  /** Altezza occupata dall'header, area sicura inclusa. */
  top: number;
  /** Altezza occupata dalla barra delle azioni, area sicura inclusa. */
  bottom: number;
};

const ScreenChromeContext = createContext<ScreenChrome>({ top: 0, bottom: 0 });

/**
 * Chrome che non appartiene alla schermata ma le sta comunque sopra: la tab
 * bar e la barra dell'allenamento in corso, montate nel layout delle tab.
 *
 * Le schermate non possono misurarlo — non è roba loro — ma devono lasciargli
 * spazio, e la barra delle azioni deve poggiarci sopra invece di finirci sotto.
 */
const OuterChromeContext = createContext<number>(0);

export function OuterChromeProvider({ height, children }: { height: number; children: ReactNode }) {
  return <OuterChromeContext.Provider value={height}>{children}</OuterChromeContext.Provider>;
}

/** Quanto spazio il chrome fisso sta occupando sopra e sotto il contenuto. */
export function useScreenChrome(): ScreenChrome {
  return useContext(ScreenChromeContext);
}

export function Screen({
  children,
  padded = true,
  edges = ['top'],
  style,
  /** Chrome fisso in alto: di norma uno `ScreenHeader`. */
  header,
  /** Chrome fisso in basso: di norma una `ActionBar`. */
  actionBar,
}: {
  children: ReactNode;
  /** Applica il margine orizzontale standard. */
  padded?: boolean;
  edges?: ('top' | 'bottom')[];
  style?: ViewStyle;
  header?: ReactNode;
  actionBar?: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [topHeight, setTopHeight] = useState(0);
  const [bottomHeight, setBottomHeight] = useState(0);
  const outerBottom = useContext(OuterChromeContext);

  const hasChrome = Boolean(header || actionBar);

  const root: ViewStyle = {
    backgroundColor: theme.colors.bg,
    // Con un header fisso l'area sicura la gestisce l'header, non la schermata:
    // altrimenti si sommerebbe due volte.
    paddingTop: header || !edges.includes('top') ? 0 : insets.top,
    paddingBottom: actionBar || !edges.includes('bottom') ? 0 : insets.bottom,
    paddingHorizontal: padded ? theme.space.lg : 0,
  };

  if (!hasChrome) {
    return (
      <ScreenChromeContext.Provider value={{ top: 0, bottom: outerBottom }}>
        <View style={[styles.root, root, style]}>{children}</View>
      </ScreenChromeContext.Provider>
    );
  }

  return (
    <ScreenChromeContext.Provider value={{ top: topHeight, bottom: bottomHeight + outerBottom }}>
      <View style={[styles.root, root, style]}>
        {/* Il contenuto è il bersaglio del blur; il chrome gli sta sopra come
            fratello, mai come figlio: una vista non può sfocare sé stessa. */}
        <BlurTargetProvider style={styles.fill}>{children}</BlurTargetProvider>

        {header ? (
          <View
            style={styles.top}
            pointerEvents="box-none"
            onLayout={(e) => setTopHeight(e.nativeEvent.layout.height)}>
            {header}
          </View>
        ) : null}

        {actionBar ? (
          <View
            // Poggia sopra la tab bar, non sotto.
            style={[styles.bottom, { bottom: outerBottom }]}
            pointerEvents="box-none"
            onLayout={(e) => setBottomHeight(e.nativeEvent.layout.height)}>
            {actionBar}
          </View>
        ) : null}
      </View>
    </ScreenChromeContext.Provider>
  );
}

/**
 * Lo scroll di una schermata con chrome fisso.
 *
 * Aggiunge da sé il margine per non finire sotto header e barra azioni: è
 * l'unico modo per non doverselo ricordare in quindici rotte, e per non
 * scoprire l'errore solo quando un pulsante non risponde perché ha il vetro
 * davanti.
 */
export function ScreenScroll({
  children,
  contentContainerStyle,
  gap,
  padded = true,
  ...rest
}: ScrollViewProps & { children: ReactNode; gap?: number; padded?: boolean }) {
  const theme = useTheme();
  const chrome = useScreenChrome();

  return (
    <ScrollView
      {...rest}
      contentContainerStyle={[
        {
          paddingTop: chrome.top + theme.space.md,
          paddingBottom: chrome.bottom + theme.space.xl,
          paddingHorizontal: padded ? theme.space.lg : 0,
          gap,
        },
        contentContainerStyle,
      ]}
      scrollIndicatorInsets={{ top: chrome.top, bottom: chrome.bottom }}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
