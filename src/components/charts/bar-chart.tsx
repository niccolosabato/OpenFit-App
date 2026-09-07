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
 * suggerirebbe un'identità che non esiste. L'unica variazione è fra chi ha
 * raggiunto la soglia settimanale e chi no, che è un'informazione vera.
 */

import { StyleSheet, View } from 'react-native';

import { ProgressBar } from '@/components/ui/progress';
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
        <Text variant="caption" tone="faint" style={styles.centered}>
          {emptyLabel}
        </Text>
      </View>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={{ gap: theme.space.md }}>
      {data.map((datum) => (
        <View key={datum.label} style={{ gap: 6 }}>
          <View style={styles.labelRow}>
            <Text
              variant="caption"
              tone={datum.muted ? 'faint' : 'dim'}
              numberOfLines={1}
              style={styles.label}>
              {datum.label}
            </Text>
            <Text
              variant="caption"
              weight="semibold"
              tone={datum.muted ? 'faint' : 'default'}
              numeric>
              {datum.display ?? String(datum.value)}
            </Text>
          </View>

          <ProgressBar
            // Le barre a zero restano un filo visibile: una traccia vuota e una
            // categoria mancante si leggerebbero uguali.
            value={datum.value > 0 ? Math.max(datum.value / max, 0.02) : 0}
            height={BAR_HEIGHT}
            color={datum.muted ? theme.colors.borderStrong : theme.colors.accent}
            trackColor={theme.colors.surface2}
          />
        </View>
      ))}
    </View>
  );
}

/** Altezza della barra; il raggio se lo calcola `ProgressBar`. */
const BAR_HEIGHT = 8;

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flex: 1 },
  centered: { textAlign: 'center' },
});
