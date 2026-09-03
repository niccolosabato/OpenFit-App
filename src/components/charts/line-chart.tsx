/**
 * Andamento di una metrica nel tempo. Una serie sola.
 *
 * Scelte di forma:
 * - **Una serie, nessuna legenda**: il titolo dice già cosa si sta guardando,
 *   e il colore è l'accento — non porta identità, solo enfasi.
 * - **Nessun secondo asse.** Se servono due metriche si fanno due grafici.
 * - **Etichette selettive**: si scrive il valore solo sull'ultimo punto e sul
 *   massimo, non su tutti; il resto si legge toccando.
 * - **Griglia recessiva**: due linee sottili, mai una gabbia.
 */

import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

export type Point = { x: number; y: number };

const HEIGHT = 160;
const PADDING_TOP = 18;
const PADDING_BOTTOM = 22;

export function LineChart({
  data,
  formatValue,
  formatX,
  emptyLabel = 'Non ci sono ancora abbastanza dati.',
}: {
  /** Già ordinata per `x` crescente. */
  data: Point[];
  formatValue: (value: number) => string;
  formatX: (x: number) => string;
  emptyLabel?: string;
}) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  if (data.length < 2) {
    return (
      <View onLayout={onLayout} style={{ height: HEIGHT, justifyContent: 'center' }}>
        <Text variant="caption" tone="faint">
          {emptyLabel}
        </Text>
      </View>
    );
  }

  const values = data.map((p) => p.y);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  // Con valori tutti uguali la scala collasserebbe: si tiene un'ampiezza minima
  // così la linea resta al centro invece di schiacciarsi sul bordo.
  const span = maxValue - minValue || Math.max(1, maxValue * 0.1);
  const low = minValue - span * 0.15;
  const high = maxValue + span * 0.15;

  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const toX = (index: number) => (index / (data.length - 1)) * Math.max(width - 2, 1) + 1;
  const toY = (value: number) => PADDING_TOP + (1 - (value - low) / (high - low)) * plotHeight;

  const path = data.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.y)}`).join(' ');

  const lastIndex = data.length - 1;
  const maxIndex = values.indexOf(maxValue);
  const active = selected ?? lastIndex;

  // I pallini si disegnano solo quando sono pochi: su venti sessioni
  // diventerebbero una collana che copre la linea.
  const showMarkers = data.length <= 12;

  return (
    <View style={{ gap: theme.space.sm }}>
      <View style={styles.readout}>
        <Text variant="heading" numeric>
          {formatValue(data[active].y)}
        </Text>
        <Text variant="caption" tone="faint">
          {formatX(data[active].x)}
        </Text>
      </View>

      <View onLayout={onLayout} style={{ height: HEIGHT }}>
        {width > 0 ? (
          <>
            <Svg width={width} height={HEIGHT}>
              {/* Griglia: solo minimo e massimo, sottilissimi. */}
              <Line
                x1={0}
                y1={toY(maxValue)}
                x2={width}
                y2={toY(maxValue)}
                stroke={theme.colors.border}
                strokeWidth={1}
              />
              <Line
                x1={0}
                y1={toY(minValue)}
                x2={width}
                y2={toY(minValue)}
                stroke={theme.colors.border}
                strokeWidth={1}
              />

              <Path
                d={path}
                stroke={theme.colors.accent}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              />

              {showMarkers
                ? data.map((p, i) => (
                    <Circle
                      key={i}
                      cx={toX(i)}
                      cy={toY(p.y)}
                      r={4}
                      fill={theme.colors.bg}
                      stroke={theme.colors.accent}
                      strokeWidth={2}
                    />
                  ))
                : null}

              {/* Punto attivo: sempre visibile, con anello di superficie che lo
                  stacca dalla linea sotto. */}
              <Circle
                cx={toX(active)}
                cy={toY(data[active].y)}
                r={5}
                fill={theme.colors.accent}
                stroke={theme.colors.bg}
                strokeWidth={2}
              />
              {maxIndex !== active ? (
                <Circle
                  cx={toX(maxIndex)}
                  cy={toY(maxValue)}
                  r={3}
                  fill={theme.colors.record}
                />
              ) : null}
            </Svg>

            {/* Fascia di tocco: si divide la larghezza in tante zone quanti i
                punti, così ogni bersaglio è molto più grande del pallino. */}
            <View style={StyleSheet.absoluteFill}>
              <View style={styles.touchRow}>
                {data.map((_, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setSelected(i)}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatX(data[i].x)}: ${formatValue(data[i].y)}`}
                    style={styles.touchCell}
                  />
                ))}
              </View>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.axis}>
        <Text variant="caption" tone="faint">
          {formatX(data[0].x)}
        </Text>
        <Text variant="caption" tone="faint">
          {formatX(data[lastIndex].x)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  touchRow: { flex: 1, flexDirection: 'row' },
  touchCell: { flex: 1 },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
});
