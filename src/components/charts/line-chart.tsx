/**
 * Andamento di una metrica nel tempo. Una serie sola.
 *
 * Scelte di forma:
 * - **Una serie, nessuna legenda**: il titolo dice già cosa si sta guardando,
 *   e il colore è l'accento — non porta identità, solo enfasi.
 * - **Nessun secondo asse.** Se servono due metriche si fanno due grafici.
 * - **Un'area sotto la linea**, sfumata fino a sparire: dà peso al grafico
 *   senza aggiungere inchiostro dove i dati non ci sono. La linea da sola, su
 *   un fondo quasi nero, sembrava un filo dimenticato.
 * - **Griglia recessiva**: due linee sottili, mai una gabbia.
 * - **Una guida verticale** sul punto toccato: senza, su dodici settimane non
 *   si capiva a quale colonna corrispondesse il valore letto in alto.
 */

import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

export type Point = { x: number; y: number };

const HEIGHT = 170;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 16;

/**
 * Il tracciato, passando per tutti i punti con angoli smussati.
 *
 * È una spline cardinale convertita in curve di Bézier: i punti restano quelli
 * misurati — non è una perequazione — ma gli spigoli spariscono. `TENSION` a
 * un sesto è il valore che smussa senza far debordare la curva sotto lo zero
 * fra due settimane molto diverse, che con una tensione più alta capita.
 */
function smoothPath(points: { x: number; y: number }[]): string {
  const TENSION = 1 / 6;
  if (points.length < 2) return '';

  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const previous = points[i - 1] ?? points[i];
    const current = points[i];
    const next = points[i + 1];
    const after = points[i + 2] ?? next;

    const c1x = current.x + (next.x - previous.x) * TENSION;
    const c1y = current.y + (next.y - previous.y) * TENSION;
    const c2x = next.x - (after.x - current.x) * TENSION;
    const c2y = next.y - (after.y - current.y) * TENSION;

    path += ` C${c1x},${c1y} ${c2x},${c2y} ${next.x},${next.y}`;
  }
  return path;
}

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
      <View
        onLayout={onLayout}
        style={{ height: HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="caption" tone="faint" style={styles.centered}>
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
  const low = minValue - span * 0.2;
  const high = maxValue + span * 0.2;

  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const toX = (index: number) => (index / (data.length - 1)) * Math.max(width - 2, 1) + 1;
  const toY = (value: number) => PADDING_TOP + (1 - (value - low) / (high - low)) * plotHeight;

  const plotted = data.map((p, i) => ({ x: toX(i), y: toY(p.y) }));
  const line = smoothPath(plotted);
  // L'area è la stessa curva, chiusa in basso: non un secondo tracciato che
  // potrebbe scostarsi dal primo di un pixel e mostrare una fessura.
  const area = `${line} L${plotted[plotted.length - 1].x},${HEIGHT} L${plotted[0].x},${HEIGHT} Z`;

  const lastIndex = data.length - 1;
  const maxIndex = values.indexOf(maxValue);
  const active = selected ?? lastIndex;

  // I pallini si disegnano solo quando sono pochi: su venti sessioni
  // diventerebbero una collana che copre la linea.
  const showMarkers = data.length <= 12;

  return (
    <View style={{ gap: theme.space.sm }}>
      <View style={[styles.readout, { gap: theme.space.sm }]}>
        <Text variant="metric" numeric>
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
              <Defs>
                <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={theme.colors.accent} stopOpacity={0.28} />
                  <Stop offset="1" stopColor={theme.colors.accent} stopOpacity={0} />
                </LinearGradient>
              </Defs>

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

              <Path d={area} fill="url(#areaFill)" />

              {/* La guida del punto attivo sta sotto la linea: se stesse sopra
                  la taglierebbe in due proprio dove si sta guardando. */}
              <Line
                x1={toX(active)}
                y1={PADDING_TOP - 8}
                x2={toX(active)}
                y2={HEIGHT}
                stroke={theme.colors.borderStrong}
                strokeWidth={1}
                strokeDasharray="3 4"
              />

              <Path
                d={line}
                stroke={theme.colors.accent}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
              />

              {showMarkers
                ? plotted.map((p, i) => (
                    <Circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={3.5}
                      fill={theme.colors.bg}
                      stroke={theme.colors.accent}
                      strokeWidth={2}
                    />
                  ))
                : null}

              {maxIndex !== active ? (
                <Circle cx={toX(maxIndex)} cy={toY(maxValue)} r={3} fill={theme.colors.record} />
              ) : null}

              {/* Punto attivo: sempre visibile, con anello di fondo che lo
                  stacca dalla linea sotto. */}
              <Circle
                cx={toX(active)}
                cy={toY(data[active].y)}
                r={6}
                fill={theme.colors.accent}
                stroke={theme.colors.bg}
                strokeWidth={3}
              />
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
  readout: { flexDirection: 'row', alignItems: 'baseline' },
  touchRow: { flex: 1, flexDirection: 'row' },
  touchCell: { flex: 1 },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  centered: { textAlign: 'center' },
});
