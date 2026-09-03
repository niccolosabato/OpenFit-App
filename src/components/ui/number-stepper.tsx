import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/theme';
import { formatNumber } from '@/lib/units';
import { Text } from './text';

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

  function clamp(next: number): number {
    let result = next;
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    // Il passo può essere 0.5 o 2.5: si arrotonda per non accumulare code.
    return Number(result.toFixed(3));
  }

  function bump(direction: -1 | 1) {
    const base = value ?? min ?? 0;
    onChange(clamp(base + direction * step));
  }

  return (
    <View style={{ gap: theme.space.sm }}>
      {label ? (
        <Text variant="label" tone="dim">
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.row,
          {
            height: theme.hit,
            backgroundColor: theme.colors.surface2,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
          },
        ]}>
        <Pressable
          onPress={() => bump(-1)}
          accessibilityRole="button"
          accessibilityLabel={`Diminuisci ${label ?? ''}`}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.5 }]}>
          <MaterialCommunityIcons name="minus" size={20} color={theme.colors.text} />
        </Pressable>

        <View style={styles.valueBox}>
          <TextInput
            value={value === null ? '' : formatNumber(value)}
            onChangeText={(raw) => {
              const cleaned = raw.replace(',', '.').trim();
              if (cleaned === '') {
                onChange(allowEmpty ? null : min ?? 0);
                return;
              }
              const parsed = Number.parseFloat(cleaned);
              if (Number.isFinite(parsed)) onChange(clamp(parsed));
            }}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textFaint}
            keyboardType="decimal-pad"
            selectTextOnFocus
            style={[
              styles.input,
              { color: theme.colors.text, fontSize: theme.font.size.lg, fontVariant: ['tabular-nums'] },
            ]}
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
          <MaterialCommunityIcons name="plus" size={20} color={theme.colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth * 2 },
  button: { width: 46, height: '100%', alignItems: 'center', justifyContent: 'center' },
  valueBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  input: { textAlign: 'center', minWidth: 50, padding: 0, includeFontPadding: false, fontWeight: '700' },
});
