/**
 * La superficie in vetro.
 *
 * Unico punto in cui il vetro si compone: ogni card, foglio, barra e chip
 * passa di qui. Nasconde ai chiamanti quale dei due meccanismi sta usando —
 * blur reale o vetro simulato — così la scelta si può cambiare in un posto solo
 * (vedi `blur-target.tsx` per il perché ce ne siano due).
 *
 * Un vetro convincente su fondo scuro è fatto di quattro strati sovrapposti:
 *
 *   1. un velo chiaro che alza la luminosità rispetto al fondo   (`fill*`)
 *   2. una linea di luce sul bordo alto, da dove arriva la luce  (`strokeTop`)
 *   3. un bordo tenue sugli altri lati, che chiude la forma      (`stroke`)
 *   4. un riflesso che scende dall'alto e si spegne              (`sheen*`)
 *
 * Il riflesso è un gradiente di `react-native-svg`, già in progetto per i
 * grafici: non serve aggiungere `expo-linear-gradient` solo per questo.
 */

import { useId, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme, type ElevationKey } from '@/theme';
import { loadBlur, useBlurTarget } from './blur-target';

export type GlassLevel = 'low' | 'mid' | 'high';

export type GlassProps = {
  children?: ReactNode;
  /** Quanto è "spesso" il vetro: low card, mid superfici sopra una card, high chrome e fogli. */
  level?: GlassLevel;
  elevation?: ElevationKey;
  radius?: number;
  /** Il riflesso in alto. Si toglie sulle superfici molto basse o molto piccole. */
  sheen?: boolean;
  /** Vela la superficie con l'accento: selezionato, attivo, a fuoco. */
  tinted?: boolean;
  /** Vela di rosso: azioni distruttive. */
  danger?: boolean;
  /** Stato premuto: alza il velo di un gradino. */
  pressed?: boolean;
  /**
   * Chiede il blur reale del contenuto sottostante. Concesso solo al chrome
   * fisso: dove non è possibile si ricade sul simulato senza dirlo a nessuno.
   */
  blur?: boolean;
  style?: StyleProp<ViewStyle>;
};

const FILL: Record<GlassLevel, 'fillLow' | 'fillMid' | 'fillHigh'> = {
  low: 'fillLow',
  mid: 'fillMid',
  high: 'fillHigh',
};

/**
 * Il riflesso occupa la metà superiore: più in basso non lo si legge.
 *
 * Due accortezze, entrambe imparate a spese di una schermata bianca:
 *
 * - l'opacità va in `stopOpacity`, non dentro un `rgba()` in `stopColor`:
 *   react-native-svg l'alfa nella stringa non la legge, e ogni riflesso
 *   diventa un rettangolo bianco pieno sopra il contenuto;
 * - l'`id` del gradiente è unico per istanza. Sono decine di lastre per
 *   schermata, e un id ripetuto fa sì che tutte peschino la definizione di
 *   un'altra.
 */
function Sheen({ radius }: { radius: number }) {
  const theme = useTheme();
  const gradientId = `glassSheen-${useId()}`;

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={theme.glass.sheenOpacity} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect
        x="0"
        y="0"
        width="100%"
        height="55%"
        rx={radius}
        ry={radius}
        fill={`url(#${gradientId})`}
      />
    </Svg>
  );
}

export function Glass({
  children,
  level = 'low',
  elevation = 'none',
  radius,
  sheen = true,
  tinted = false,
  danger = false,
  pressed = false,
  blur = false,
  style,
}: GlassProps) {
  const theme = useTheme();
  const blurTarget = useBlurTarget();

  const cornerRadius = radius ?? theme.radius.lg;

  // Il blur reale richiede sia il modulo sia un bersaglio: fuori da un
  // `BlurTargetProvider` (o dentro un `Modal`) il bersaglio è `null`.
  const blurModule = blur ? loadBlur() : null;
  const canBlur = Boolean(blurModule && blurTarget);

  const backgroundColor = pressed
    ? theme.glass.fillPress
    : danger
      ? theme.colors.dangerTint
      : tinted
        ? theme.colors.accentTint
        : theme.glass[FILL[level]];

  const frame: ViewStyle = {
    borderRadius: cornerRadius,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: danger ? theme.colors.danger : tinted ? theme.colors.accentEdge : theme.glass.stroke,
    borderTopColor: danger
      ? theme.colors.danger
      : tinted
        ? theme.colors.accent
        : theme.glass.strokeTop,
    overflow: 'hidden',
  };

  // Una sola cornice in entrambi i casi: `style` (e quindi il padding di chi
  // chiama) sta sempre sullo stesso nodo, e `overflow: hidden` ritaglia gli
  // strati sul raggio giusto.
  return (
    <View
      style={[
        theme.elevation[elevation],
        frame,
        { backgroundColor: canBlur ? 'transparent' : backgroundColor },
        style,
      ]}>
      {canBlur && blurModule ? (
        <>
          <blurModule.BlurView
            blurTarget={blurTarget ?? undefined}
            // Su Android il blur costa: `dimezisBlurViewSdk31Plus` lo concede
            // solo dove l'hardware lo regge e ricade su una tinta piatta altrove.
            blurMethod="dimezisBlurViewSdk31Plus"
            intensity={theme.blurIntensity.chrome}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          {/* Velo scuro sopra il blur: senza, il testo chiaro sparisce quando
              sotto scorre una superficie luminosa. */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.glass.scrim }]} />
          {/* E sopra ancora il velo del livello, che dà al vetro la sua tinta. */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor }]} />
        </>
      ) : null}
      {sheen ? <Sheen radius={cornerRadius} /> : null}
      {children}
    </View>
  );
}
