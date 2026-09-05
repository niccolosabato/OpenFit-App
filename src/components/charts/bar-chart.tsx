/**
 * Confronto di grandezze fra categorie (serie per gruppo muscolare, volume
 * per esercizio).
 *
 * Barre orizzontali e non verticali: le etichette sono parole italiane lunghe
 * ("Quadricipiti", "Deltoidi posteriori") e in verticale finirebbero ruotate
 * o troncate.
 *
 * Un solo colore per tutte le barre: qui il colore non distingue nulla — a
 * distinguere è l'etichetta sull'asse — e dare una tinta diversa a ogni barra
 * suggerirebbe un'identità che non esiste.
 */

import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

export type BarDatum = {
  label: string;
  value: number;
  /** Testo a destra della barra; se assente si mostra il valore grezzo. */
  display?: string;
  /** Evidenzia la barra (es. sotto la soglia settimanale). */
  muted?: boolean;
};

export function BarChart({
  data,
  emptyLabel = 'Nessun dato nel periodo.',
}: {
  data: BarDatum[];
  emptyLabel?: string;
}) {
  const theme = useTheme();

  if (data.length === 0) {
    // Stesso trattamento del grafico a linee: un messaggio che sostituisce un
    // disegno sta al centro di dove sarebbe stato il disegno, non appoggiato a
    // sinistra come fosse una didascalia.
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', padding: theme.space.lg }}>
        <Text variant="caption" tone="faint" style={{ textAlign: 'center' }}>
          {emptyLabel}
        </Text>
      </View>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={{ gap: theme.space.md }}>
      {data.map((datum) => (
        <View key={datum.label} style={{ gap: 4 }}>
          <View style={styles.labelRow}>
            <Text variant="caption" tone="dim" numberOfLines={1} style={{ flex: 1 }}>
              {datum.label}
            </Text>
            <Text variant="caption" numeric>
              {datum.display ?? String(datum.value)}
            </Text>
          </View>

          <View style={[styles.track, { backgroundColor: theme.colors.surface2, borderRadius: 4 }]}>
            <View
              style={{
                width: `${Math.max((datum.value / max) * 100, datum.value > 0 ? 2 : 0)}%`,
                height: '100%',
                borderRadius: 4,
                backgroundColor: datum.muted ? theme.colors.borderStrong : theme.colors.accent,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { height: 10, overflow: 'hidden' },
});
