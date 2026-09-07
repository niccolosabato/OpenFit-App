import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { capsule, useTheme } from '@/theme';
import { Divider } from './section';
import { Surface } from './surface';
import { Text } from './text';

/**
 * Contenitore di una sezione di impostazioni, con titolo.
 *
 * I separatori fra le righe li mette la sezione, non le righe: prima ogni
 * riga disegnava il proprio bordo superiore e la prima della lista finiva con
 * un filo appeso sotto il bordo della card.
 */
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  const rows = Children.toArray(children);

  return (
    <View style={{ gap: theme.space.sm }}>
      <View style={{ paddingHorizontal: theme.space.md, gap: theme.space.xs }}>
        <Text variant="label" tone="dim">
          {title}
        </Text>
        {description ? (
          <Text variant="caption" tone="faint">
            {description}
          </Text>
        ) : null}
      </View>
      <Surface level="low">
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <Divider inset={theme.space.lg} /> : null}
            {row}
          </Fragment>
        ))}
      </Surface>
    </View>
  );
}

/** Riga con interruttore. */
export function SwitchRow({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.row,
        { minHeight: theme.hit + 10, paddingHorizontal: theme.space.lg, gap: theme.space.md },
      ]}>
      <View style={{ flex: 1, gap: theme.space.xs }}>
        <Text variant="body" tone={disabled ? 'faint' : 'default'}>
          {label}
        </Text>
        {description ? (
          <Text variant="caption" tone="faint">
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: theme.colors.accentDim, false: theme.colors.surface3 }}
        thumbColor={value ? theme.colors.accent : theme.colors.textFaint}
      />
    </View>
  );
}

/** Riga che apre qualcosa: un foglio, un'altra schermata. */
export function NavRow({
  label,
  value,
  description,
  onPress,
  destructive,
  icon,
}: {
  label: string;
  value?: string;
  description?: string;
  onPress: () => void;
  destructive?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { minHeight: theme.hit + 10, paddingHorizontal: theme.space.lg, gap: theme.space.md },
        pressed && { backgroundColor: theme.colors.surface2 },
      ]}>
      {icon ? (
        <Surface level="mid" radius={capsule(GLYPH)} bordered={false} style={styles.glyph}>
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={destructive ? theme.colors.danger : theme.colors.textDim}
          />
        </Surface>
      ) : null}
      <View style={{ flex: 1, gap: theme.space.xs }}>
        <Text variant="body" tone={destructive ? 'danger' : 'default'}>
          {label}
        </Text>
        {description ? (
          <Text variant="caption" tone="faint">
            {description}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="caption" tone="dim" numeric numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      ) : null}
      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textFaint} />
    </Pressable>
  );
}

/** Il disco dell'icona di una riga: misura e raggio da un numero solo. */
const GLYPH = 34;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  glyph: { width: GLYPH, height: GLYPH, alignItems: 'center', justifyContent: 'center' },
  // Un valore lungo ("Push Pull Legs — autunno") non deve spingere fuori il
  // chevron: si accorcia lui.
  value: { flexShrink: 1, maxWidth: '45%', textAlign: 'right' },
});
