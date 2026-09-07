import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Surface } from '@/components/ui/surface';
import { Text, typography } from '@/components/ui/text';
import { usePressScale } from '@/components/ui/use-press-scale';
import { SET_TYPE_BADGE, usesDuration, usesReps, usesWeight, type SetType, type TrackingType } from '@/db/enums';
import type { SessionSet } from '@/db/schema';
import { formatDuration } from '@/lib/format';
import { formatNumber, fromKg, toKg } from '@/lib/units';
import type { EffortScale, WeightUnit } from '@/db/enums';
import { useTheme } from '@/theme';
import type { SetValues } from './actions';

/** Larghezza delle colonne fisse: indice a sinistra, spunta a destra. */
const INDEX_WIDTH = 32;
const CHECK_WIDTH = 48;
/** Altezza di una riga e delle celle che contiene. */
const ROW_HEIGHT = 60;
const CELL_HEIGHT = 44;
/** Spessore della barretta che marca a sinistra una serie fatta. */
const DONE_MARK = 3;

export function SetRowHeader({ tracking, effortScale, unit }: { tracking: TrackingType; effortScale: EffortScale; unit: WeightUnit }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { paddingHorizontal: theme.space.md, paddingVertical: 6, gap: theme.space.xs }]}>
      <Text variant="label" tone="faint" style={{ width: INDEX_WIDTH, textAlign: 'center' }}>
        Ser
      </Text>
      <Text variant="label" tone="faint" style={[styles.previousCell, styles.centered]}>
        Prec.
      </Text>
      {usesWeight(tracking) ? (
        <Text variant="label" tone="faint" style={[styles.inputCell, styles.centered]}>
          {unit}
        </Text>
      ) : null}
      {usesReps(tracking) ? (
        <Text variant="label" tone="faint" style={[styles.inputCell, styles.centered]}>
          Rip
        </Text>
      ) : null}
      {usesDuration(tracking) ? (
        <Text variant="label" tone="faint" style={[styles.inputCell, styles.centered]}>
          Tempo
        </Text>
      ) : null}
      {effortScale !== 'none' ? (
        <Text variant="label" tone="faint" style={[styles.effortCell, styles.centered]}>
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
  const checkPress = usePressScale();

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
          minHeight: ROW_HEIGHT,
          paddingRight: theme.space.md,
          // La barretta della serie fatta sta nei primi 3 punti, che sono già
          // dentro il margine: le colonne non si spostano quando compare.
          paddingLeft: isChild ? theme.space.md + 12 : theme.space.md,
          gap: theme.space.xs,
          backgroundColor: done ? theme.colors.accentGlow : 'transparent',
        },
      ]}>
      {/* La barretta d'accento sul filo sinistro: dice "questa è fatta" anche
          quando la riga è mezza coperta dalla tastiera, e non ruba spazio a
          nessuna colonna. */}
      {done ? (
        <View
          pointerEvents="none"
          style={[styles.doneMark, { backgroundColor: theme.colors.accent }]}
        />
      ) : null}

      <Pressable
        onPress={onOpenMenu}
        accessibilityRole="button"
        accessibilityLabel="Tipo di serie"
        style={{ width: INDEX_WIDTH, minHeight: theme.hit, alignItems: 'center', justifyContent: 'center' }}>
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

      {/* Era testo inerte, e invece è il pulsante che si preme di più:
          ricopia i valori della volta scorsa. Ora ha una superficie sotto e
          l'icona che dice cosa fa. */}
      <Pressable
        onPress={copyPrevious}
        disabled={!previous}
        accessibilityRole="button"
        accessibilityLabel="Ricopia la volta precedente"
        accessibilityHint="Riempie carico e ripetizioni con i valori dell'ultima volta"
        style={styles.previousCell}>
        {({ pressed }) =>
          previous ? (
            <Surface
              level="mid"
              radius={theme.radius.md}
              pressed={pressed}
              bordered={false}
              style={[styles.previousBox, { height: CELL_HEIGHT }]}>
              <MaterialCommunityIcons name="content-copy" size={11} color={theme.colors.accentDim} />
              <Text variant="caption" tone="dim" numeric numberOfLines={1}>
                {previousLabel}
              </Text>
            </Surface>
          ) : (
            <Text variant="caption" tone="faint" numeric numberOfLines={1} style={styles.centered}>
              {previousLabel}
            </Text>
          )
        }
      </Pressable>

      {usesWeight(tracking) ? (
        <Cell
          value={weight}
          onChangeText={setWeight}
          onFocus={() => (focusedRef.current = true)}
          onBlur={commit}
          placeholder={previous?.weight != null ? formatNumber(fromKg(previous.weight, unit)) : '—'}
        />
      ) : null}

      {usesReps(tracking) ? (
        <Cell
          value={reps}
          onChangeText={setReps}
          onFocus={() => (focusedRef.current = true)}
          onBlur={commit}
          placeholder={previous?.reps != null ? String(previous.reps) : '—'}
        />
      ) : null}

      {usesDuration(tracking) ? (
        <Cell
          value={duration}
          onChangeText={setDuration}
          onFocus={() => (focusedRef.current = true)}
          onBlur={commit}
          placeholder={previous?.durationSeconds != null ? String(previous.durationSeconds) : 's'}
        />
      ) : null}

      {effortScale !== 'none' ? (
        <Cell
          value={effort}
          onChangeText={setEffort}
          onFocus={() => (focusedRef.current = true)}
          onBlur={commit}
          placeholder="—"
          narrow
        />
      ) : null}

      <Pressable
        onPress={() => {
          focusedRef.current = false;
          if (done) onUncomplete();
          else onComplete(currentValues());
        }}
        onPressIn={checkPress.onPressIn}
        onPressOut={checkPress.onPressOut}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={done ? 'Annulla la serie' : 'Segna la serie come fatta'}
        style={({ pressed }) => pressed && { opacity: 0.7 }}>
        <Animated.View style={checkPress.style}>
          <CheckBox done={done} isPr={set.isPr} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

/**
 * La spunta.
 *
 * Il pieno d'accento è un velo sopra, non il fondo della vista: cambiare il
 * fondo di una vista arrotondata su Android le fa perdere il raggio, e la
 * spunta tornava quadrata appena la si spuntava. Il velo si dissolve, e
 * l'icona rimbalza: è l'unico gesto che si ripete trenta volte in una seduta,
 * e vale la pena che risponda.
 */
function CheckBox({ done, isPr }: { done: boolean; isPr: boolean }) {
  const theme = useTheme();
  const fill = useSharedValue(done ? 1 : 0);
  const pop = useSharedValue(1);
  const first = useRef(true);

  useEffect(() => {
    fill.value = withTiming(done ? 1 : 0, { duration: theme.motion.duration.fast });
    // Al primo montaggio no: rientrando in una sessione con venti serie già
    // fatte partirebbero venti rimbalzi insieme.
    if (first.current) {
      first.current = false;
      return;
    }
    if (done) {
      pop.value = withSpring(1, { ...theme.motion.spring, velocity: 14 });
    }
  }, [done, fill, pop, theme.motion.duration.fast, theme.motion.spring]);

  const veil = useAnimatedStyle(() => ({ opacity: fill.value }));
  const glyph = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <View
      style={[
        styles.check,
        {
          width: CHECK_WIDTH,
          height: CELL_HEIGHT,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface2,
          borderColor: isPr && done ? theme.colors.record : theme.colors.border,
        },
      ]}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, veil, { backgroundColor: theme.colors.accent }]}
      />
      <Animated.View style={glyph}>
        <MaterialCommunityIcons
          name={isPr && done ? 'trophy' : 'check'}
          size={20}
          color={done ? theme.colors.onAccent : theme.colors.textFaint}
        />
      </Animated.View>
    </View>
  );
}

/**
 * Una cella numerica.
 *
 * A fuoco si tinge d'accento: con quattro celle uguali affiancate e il
 * telefono appoggiato sulla panca, sapere in quale si sta scrivendo non era
 * scontato — e battere il peso nella colonna delle ripetizioni è un errore
 * che ci si accorge solo dopo.
 */
function Cell({
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder,
  narrow,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  placeholder: string;
  narrow?: boolean;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onFocus={() => {
        setFocused(true);
        onFocus();
      }}
      onBlur={() => {
        setFocused(false);
        onBlur();
      }}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textFaint}
      keyboardType="decimal-pad"
      selectTextOnFocus
      style={[
        narrow ? styles.effortCell : styles.inputCell,
        styles.input,
        typography('subtitle'),
        {
          height: CELL_HEIGHT,
          borderRadius: theme.radius.md,
          backgroundColor: focused ? theme.colors.accentGlow : theme.colors.surface2,
          borderColor: focused ? theme.colors.accent : theme.colors.border,
          color: theme.colors.text,
          fontSize: theme.font.size.lg,
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
  doneMark: { position: 'absolute', left: 0, top: 6, bottom: 6, width: DONE_MARK },
  previousCell: { flex: 1.3, justifyContent: 'center' },
  previousBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  inputCell: { flex: 1 },
  effortCell: { width: 40 },
  centered: { textAlign: 'center' },
  input: {
    textAlign: 'center',
    textAlignVertical: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  check: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
});
