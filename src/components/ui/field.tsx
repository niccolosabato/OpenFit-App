import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { useTheme } from '@/theme';
import { Chip } from './chip';
import { Text } from './text';

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

  return (
    <View style={{ gap: theme.space.sm }}>
      <Text variant="label" tone="dim">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textFaint}
        multiline={multiline}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        style={[
          styles.input,
          {
            minHeight: multiline ? 96 : theme.hit,
            backgroundColor: theme.colors.surface2,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.space.md,
            paddingVertical: multiline ? theme.space.md : 0,
            color: theme.colors.text,
            fontSize: theme.font.size.md,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
      />
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
            compact
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
  input: { borderWidth: StyleSheet.hairlineWidth * 2, includeFontPadding: false },
  options: { flexDirection: 'row', flexWrap: 'wrap' },
});
