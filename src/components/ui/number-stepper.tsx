import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { capsule, useTheme } from '@/theme';
import { formatNumber } from '@/lib/units';
import { Surface } from './surface';
import { Text, typography } from './text';

/**
 * Numero con − e +, e il valore digitabile al centro.
 *
 * I due bottoni sono la via normale: con le mani sudate e il telefono sulla
 * panca, toccare un bersaglio grande è molto più affidabile che aprire la
 * tastiera. La digitazione resta per i salti grossi.
 */
export function NumberStepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  suffix,
  /** Mostrato al posto del numero quando `value` è null. */
  placeholder = '—',
  allowEmpty,
}: {
  label?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  placeholder?: string;
  allowEmpty?: boolean;
}) {
  const theme = useTheme();

  /**
   * Quello che c'è scritto nel campo mentre lo si sta scrivendo.
   *
   * `null` = non lo sta scrivendo nessuno, comanda `value`. Serve perché i
   * limiti non possono valere a metà digitazione: con `min` a 100, battere la
   * prima cifra di "175" darebbe `1`, che risalirebbe subito a `100` e
   * renderebbe il campo impossibile da compilare. I limiti si applicano
   * quando si esce dal campo, come per i valori della sessione.
   */
  const [draft, setDraft] = useState<string | null>(null);

  /**
   * La selezione "tutto" si applica un istante, all'ingresso nel campo.
   *
   * `selectTextOnFocus` sembrava la scelta ovvia, ma su Android ri-seleziona
   * il testo ogni volta che il `value` cambia: dopo la prima cifra il campo
   * restava tutto selezionato, e la seconda la sostituiva — "10" diventava
   * "0". Tenendo la selezione sotto controllo e liberandola al primo tasto, il
   * valore esistente si sostituisce al primo tocco ma le cifre successive si
   * accodano come ci si aspetta.
   */
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>();

  const display = draft ?? (value === null ? '' : formatNumber(value));

  function clamp(next: number): number {
    let result = next;
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    // Il passo può essere 0.5 o 2.5: si arrotonda per non accumulare code.
    return Number(result.toFixed(3));
  }

  function bump(direction: -1 | 1) {
    const base = value ?? min ?? 0;
    setDraft(null);
    onChange(clamp(base + direction * step));
  }

  function commit() {
    setDraft(null);
    if (value !== null) onChange(clamp(value));
  }

  return (
    <View style={{ gap: theme.space.sm }}>
      {label ? (
        <Text variant="label" tone="dim">
          {label}
        </Text>
      ) : null}

      <Surface level="mid" radius={capsule(HEIGHT)} style={[styles.row, { height: HEIGHT }]}>
        <Pressable
          onPress={() => bump(-1)}
          accessibilityRole="button"
          accessibilityLabel={`Diminuisci ${label ?? ''}`}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.5 }]}>
          <MaterialCommunityIcons name="minus" size={22} color={theme.colors.text} />
        </Pressable>

        <View style={styles.valueBox}>
          <TextInput
            value={display}
            onChangeText={(raw) => {
              setSelection(undefined);
              setDraft(raw);
              const cleaned = raw.replace(',', '.').trim();
              if (cleaned === '') {
                onChange(allowEmpty ? null : min ?? 0);
                return;
              }
              const parsed = Number.parseFloat(cleaned);
              // Niente `clamp` qui: solo l'arrotondamento. Vedi `draft`.
              if (Number.isFinite(parsed)) onChange(Number(parsed.toFixed(3)));
            }}
            onFocus={() =>
              setSelection(display.length > 0 ? { start: 0, end: display.length } : undefined)
            }
            onSelectionChange={() => {
              if (selection) setSelection(undefined);
            }}
            onBlur={() => {
              setSelection(undefined);
              commit();
            }}
            onSubmitEditing={commit}
            selection={selection}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textFaint}
            keyboardType="decimal-pad"
            maxFontSizeMultiplier={1.0}
            style={[styles.input, typography('metric'), { color: theme.colors.text }]}
          />
          {suffix ? (
            <Text variant="caption" tone="faint">
              {suffix}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => bump(1)}
          accessibilityRole="button"
          accessibilityLabel={`Aumenta ${label ?? ''}`}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.5 }]}>
          <MaterialCommunityIcons name="plus" size={22} color={theme.colors.text} />
        </Pressable>
      </Surface>
    </View>
  );
}

/** Alto quanto un bottone grande: è il controllo che si preme di più nei fogli. */
const HEIGHT = 56;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  // 48 pieni: è il bersaglio che si preme di più in tutta l'app.
  button: { width: 48, height: '100%', alignItems: 'center', justifyContent: 'center' },
  valueBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  input: {
    textAlign: 'center',
    textAlignVertical: 'center',
    // Basta per tre cifre al corpo `metric`. Non di più: due stepper affiancati
    // (le ripetizioni "da/a") devono stare in una colonna da ~140dp sui telefoni
    // da 360, e con 50 il secondo "+" finiva tagliato fuori dalla superficie.
    minWidth: 40,
    padding: 0,
  },
});
