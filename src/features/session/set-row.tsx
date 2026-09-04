import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { SET_TYPE_BADGE, usesDuration, usesReps, usesWeight, type SetType, type TrackingType } from '@/db/enums';
import type { SessionSet } from '@/db/schema';
import { formatDuration } from '@/lib/format';
import { formatNumber, fromKg, toKg } from '@/lib/units';
import type { EffortScale, WeightUnit } from '@/db/enums';
import { useTheme } from '@/theme';
import type { SetValues } from './actions';

/** Larghezza delle colonne fisse: indice a sinistra, spunta a destra. */
const INDEX_WIDTH = 34;
const CHECK_WIDTH = 46;

export function SetRowHeader({ tracking, effortScale, unit }: { tracking: TrackingType; effortScale: EffortScale; unit: WeightUnit }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { paddingHorizontal: theme.space.md, paddingVertical: 6, gap: theme.space.sm }]}>
      <Text variant="label" tone="faint" style={{ width: INDEX_WIDTH, textAlign: 'center' }}>
        Ser
      </Text>
      <Text variant="label" tone="faint" style={styles.previousCell}>
        Prec.
      </Text>
      {usesWeight(tracking) ? (
        <Text variant="label" tone="faint" style={styles.inputCell}>
          {unit}
        </Text>
      ) : null}
      {usesReps(tracking) ? (
        <Text variant="label" tone="faint" style={styles.inputCell}>
          Rip
        </Text>
      ) : null}
      {usesDuration(tracking) ? (
        <Text variant="label" tone="faint" style={styles.inputCell}>
          Tempo
        </Text>
      ) : null}
      {effortScale !== 'none' ? (
        <Text variant="label" tone="faint" style={styles.effortCell}>
          {effortScale === 'rir' ? 'RIR' : 'RPE'}
        </Text>
      ) : null}
      <View style={{ width: CHECK_WIDTH }} />
    </View>
  );
}

export function SetRow({
  set,
  tracking,
  workingIndex,
  previous,
  unit,
  effortScale,
  isChild,
  prefill,
  onComplete,
  onUncomplete,
  onOpenMenu,
  onChange,
}: {
  set: SessionSet;
  tracking: TrackingType;
  /** Progressivo fra le sole serie allenanti; 0 se la serie non ne fa parte. */
  workingIndex: number;
  previous: SessionSet | null;
  unit: WeightUnit;
  effortScale: EffortScale;
  isChild?: boolean;
  /** Riempie i campi vuoti con la prestazione precedente invece di limitarsi
   *  a mostrarla come segnaposto. */
  prefill?: boolean;
  onComplete: (values: SetValues) => void;
  onUncomplete: () => void;
  onOpenMenu: () => void;
  onChange: (values: Partial<SetValues>) => void;
}) {
  const theme = useTheme();

  // I campi tengono una bozza locale: scrivere sul database a ogni tasto
  // premuto farebbe rientrare `useLiveQuery` e cancellerebbe quello che si sta
  // digitando. Si consolida quando il campo perde il fuoco o si spunta la serie.
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [effort, setEffort] = useState('');
  const [duration, setDuration] = useState('');
  const focusedRef = useRef(false);

  useEffect(() => {
    if (focusedRef.current) return;

    // Una serie già spuntata mostra sempre e solo quello che è stato fatto:
    // suggerire qualcosa sopra un dato reale sarebbe un falso.
    const suggest = prefill && !set.isCompleted ? previous : null;

    setWeight(
      set.weight !== null
        ? formatNumber(fromKg(set.weight, unit))
        : suggest?.weight != null
          ? formatNumber(fromKg(suggest.weight, unit))
          : '',
    );
    setReps(
      set.reps !== null ? String(set.reps) : suggest?.reps != null ? String(suggest.reps) : '',
    );
    setDuration(
      set.durationSeconds !== null
        ? String(set.durationSeconds)
        : suggest?.durationSeconds != null
          ? String(suggest.durationSeconds)
          : '',
    );

    const value = effortScale === 'rir' ? set.rir : set.rpe;
    setEffort(value === null ? '' : String(value));
  }, [
    set.weight,
    set.reps,
    set.durationSeconds,
    set.rpe,
    set.rir,
    set.isCompleted,
    previous,
    prefill,
    unit,
    effortScale,
  ]);

  function parse(raw: string): number | null {
    const cleaned = raw.replace(',', '.').trim();
    if (cleaned === '') return null;
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function currentValues(): SetValues {
    const rawWeight = parse(weight);
    const effortValue = parse(effort);
    return {
      weight: rawWeight === null ? null : toKg(rawWeight, unit),
      reps: parse(reps) === null ? null : Math.round(parse(reps)!),
      rpe: effortScale === 'rir' ? null : effortValue,
      rir: effortScale === 'rir' ? (effortValue === null ? null : Math.round(effortValue)) : null,
      durationSeconds: parse(duration) === null ? null : Math.round(parse(duration)!),
      distanceMeters: set.distanceMeters,
    };
  }

  function commit() {
    focusedRef.current = false;
    onChange(currentValues());
  }

  /** Ricopia la prestazione precedente nei campi: il caso più frequente. */
  function copyPrevious() {
    if (!previous) return;
    if (previous.weight !== null) setWeight(formatNumber(fromKg(previous.weight, unit)));
    if (previous.reps !== null) setReps(String(previous.reps));
    if (previous.durationSeconds !== null) setDuration(String(previous.durationSeconds));
  }

  const badge = SET_TYPE_BADGE[set.setType];
  const done = set.isCompleted;

  const previousLabel = previous ? describePrevious(previous, tracking, unit) : '—';

  return (
    <View
      style={[
        styles.row,
        {
          minHeight: 46,
          paddingHorizontal: theme.space.md,
          paddingLeft: isChild ? theme.space.md + 14 : theme.space.md,
          gap: theme.space.sm,
          backgroundColor: done ? theme.colors.accentGlow : 'transparent',
          borderTopColor: theme.colors.border,
        },
        styles.bordered,
      ]}>
      <Pressable
        onPress={onOpenMenu}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Tipo di serie"
        style={{ width: INDEX_WIDTH, alignItems: 'center' }}>
        {set.setType === 'working' && !isChild ? (
          <Text variant="subtitle" tone={done ? 'accent' : 'dim'} numeric>
            {workingIndex}
          </Text>
        ) : (
          <Text variant="label" tone={done ? 'accent' : 'faint'}>
            {badge}
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={copyPrevious}
        disabled={!previous}
        accessibilityRole="button"
        accessibilityLabel="Ricopia la volta precedente"
        style={styles.previousCell}>
        <Text variant="caption" tone="faint" numeric numberOfLines={1}>
          {previousLabel}
        </Text>
      </Pressable>

      {usesWeight(tracking) ? (
        <Cell
          value={weight}
          onChangeText={setWeight}
          onFocus={() => (focusedRef.current = true)}
          onBlur={commit}
          placeholder={previous?.weight != null ? formatNumber(fromKg(previous.weight, unit)) : '—'}
          done={done}
        />
      ) : null}

      {usesReps(tracking) ? (
        <Cell
          value={reps}
          onChangeText={setReps}
          onFocus={() => (focusedRef.current = true)}
          onBlur={commit}
          placeholder={previous?.reps != null ? String(previous.reps) : '—'}
          done={done}
        />
      ) : null}

      {usesDuration(tracking) ? (
        <Cell
          value={duration}
          onChangeText={setDuration}
          onFocus={() => (focusedRef.current = true)}
          onBlur={commit}
          placeholder={previous?.durationSeconds != null ? String(previous.durationSeconds) : 's'}
          done={done}
        />
      ) : null}

      {effortScale !== 'none' ? (
        <Cell
          value={effort}
          onChangeText={setEffort}
          onFocus={() => (focusedRef.current = true)}
          onBlur={commit}
          placeholder="—"
          done={done}
          narrow
        />
      ) : null}

      <Pressable
        onPress={() => {
          focusedRef.current = false;
          if (done) onUncomplete();
          else onComplete(currentValues());
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? 'Annulla la serie' : 'Segna la serie come fatta'}
        style={({ pressed }) => [
          styles.check,
          {
            width: CHECK_WIDTH - 8,
            height: 36,
            borderRadius: theme.radius.sm,
            backgroundColor: done ? theme.colors.accent : theme.colors.surface2,
            borderColor: done ? theme.colors.accent : theme.colors.borderStrong,
          },
          pressed && { opacity: 0.6 },
        ]}>
        <MaterialCommunityIcons
          name="check"
          size={20}
          color={done ? theme.colors.onAccent : theme.colors.textFaint}
        />
      </Pressable>

      {set.isPr ? (
        <View style={styles.prBadge}>
          <MaterialCommunityIcons name="trophy" size={13} color={theme.colors.record} />
        </View>
      ) : null}
    </View>
  );
}

function Cell({
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder,
  done,
  narrow,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  placeholder: string;
  done: boolean;
  narrow?: boolean;
}) {
  const theme = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textFaint}
      keyboardType="decimal-pad"
      selectTextOnFocus
      style={[
        narrow ? styles.effortCell : styles.inputCell,
        styles.input,
        {
          height: 36,
          borderRadius: theme.radius.sm,
          backgroundColor: done ? 'transparent' : theme.colors.surface2,
          borderColor: done ? 'transparent' : theme.colors.border,
          color: theme.colors.text,
          fontSize: theme.font.size.md,
        },
      ]}
    />
  );
}

/** `100 × 8`, `45"`, `8 rip` — com'è andata la volta scorsa, in una riga. */
function describePrevious(set: SessionSet, tracking: TrackingType, unit: WeightUnit): string {
  if (usesDuration(tracking)) {
    return set.durationSeconds ? formatDuration(set.durationSeconds) : '—';
  }
  const reps = set.reps ?? null;
  if (usesWeight(tracking) && set.weight !== null) {
    return `${formatNumber(fromKg(set.weight, unit))} × ${reps ?? '—'}`;
  }
  return reps !== null ? `${reps} rip` : '—';
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  bordered: { borderTopWidth: StyleSheet.hairlineWidth },
  previousCell: { flex: 1.5, justifyContent: 'center' },
  inputCell: { flex: 1, textAlign: 'center' },
  effortCell: { width: 46, textAlign: 'center' },
  input: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: 0,
    includeFontPadding: false,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  check: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth * 2 },
  prBadge: { position: 'absolute', right: 2, top: 2 },
});
