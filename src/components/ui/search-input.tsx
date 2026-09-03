import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/theme';

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
    <View
      style={[
        styles.root,
        {
          height: theme.hit,
          backgroundColor: theme.colors.surface2,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.space.md,
          gap: theme.space.sm,
        },
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
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cancella la ricerca">
          <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textFaint} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth * 2 },
  input: { flex: 1, padding: 0, includeFontPadding: false },
});
