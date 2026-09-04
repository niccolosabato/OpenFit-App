import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from './text';

/** Contenitore di una sezione di impostazioni, con titolo. */
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space.sm }}>
      <View style={{ paddingHorizontal: theme.space.xs, gap: 2 }}>
        <Text variant="label" tone="dim">
          {title}
        </Text>
        {description ? (
          <Text variant="caption" tone="faint">
            {description}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
        }}>
        {children}
      </View>
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
    <View style={[styles.row, { minHeight: theme.hit + 6, paddingHorizontal: theme.space.lg, gap: theme.space.md, borderTopColor: theme.colors.border }]}>
      <View style={{ flex: 1, gap: 2 }}>
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
        {
          minHeight: theme.hit + 6,
          paddingHorizontal: theme.space.lg,
          gap: theme.space.md,
          borderTopColor: theme.colors.border,
        },
        pressed && { backgroundColor: theme.colors.surface2 },
      ]}>
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={destructive ? theme.colors.danger : theme.colors.textDim}
        />
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
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
        <Text variant="body" tone="dim" numeric>
          {value}
        </Text>
      ) : null}
      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
});
