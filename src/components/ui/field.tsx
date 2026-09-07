import { useState } from 'react';
import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { useTheme } from '@/theme';
import { Chip } from './chip';
import { Surface } from './surface';
import { Text, typography } from './text';

/** Campo di testo etichettato. */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  autoFocus,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoFocus?: boolean;
  hint?: string;
}) {
  const theme = useTheme();
  // Il campo a fuoco si tinge d'accento: si vede da lontano dove si sta
  // scrivendo, anche con il telefono appoggiato sulla panca.
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: theme.space.sm }}>
      <Text variant="label" tone="dim">
        {label}
      </Text>
      <Surface level="mid" radius={theme.radius.lg} tinted={focused}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textFaint}
          multiline={multiline}
          keyboardType={keyboardType}
          autoFocus={autoFocus}
          style={[
            typography('body'),
            {
              minHeight: multiline ? 108 : theme.hit + 4,
              paddingHorizontal: theme.space.md,
              paddingVertical: multiline ? theme.space.md : 0,
              color: theme.colors.text,
              textAlignVertical: multiline ? 'top' : 'center',
              lineHeight: multiline ? theme.font.size.md * theme.font.lineHeight.normal : undefined,
            },
          ]}
        />
      </Surface>
      {hint ? (
        <Text variant="caption" tone="faint">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Scelta fra poche opzioni, resa come pillole invece che come menu a tendina:
 * un tap invece di due, e si vede tutto insieme.
 *
 * Le pillole sono a grandezza piena, non compatte: qui non sono filtri da
 * sfogliare ma la risposta a una domanda, e vanno prese al primo colpo.
 */
export function OptionField<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (v: T) => void;
  hint?: string;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.sm }}>
      <Text variant="label" tone="dim">
        {label}
      </Text>
      <View style={[styles.options, { gap: theme.space.sm }]}>
        {options.map((option) => (
          <Chip
            key={option}
            label={labels[option]}
            selected={value === option}
            onPress={() => onChange(option)}
          />
        ))}
      </View>
      {hint ? (
        <Text variant="caption" tone="faint">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: 'row', flexWrap: 'wrap' },
});
