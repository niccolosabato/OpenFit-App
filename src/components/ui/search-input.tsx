import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { useTheme } from '@/theme';
import { Glass } from './glass';

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Cerca…',
  autoFocus,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const theme = useTheme();

  return (
    <Glass
      level="mid"
      radius={theme.radius.pill}
      sheen={false}
      style={[
        styles.root,
        { height: theme.hit, paddingLeft: theme.space.md, paddingRight: theme.space.sm, gap: theme.space.sm },
      ]}>
      <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textFaint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textFaint}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        style={[styles.input, { color: theme.colors.text, fontSize: theme.font.size.md }]}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel="Cancella la ricerca"
          style={({ pressed }) => [styles.clear, pressed && { opacity: 0.6 }]}>
          <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.textFaint} />
        </Pressable>
      ) : null}
    </Glass>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, padding: 0, includeFontPadding: false },
  clear: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
