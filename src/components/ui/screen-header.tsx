import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { Glass } from './glass';
import { IconButton } from './icon-button';
import { Text } from './text';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type HeaderAction = {
  icon: IconName;
  label: string;
  onPress: () => void;
};

/**
 * Intestazione di schermata: titolo, ritorno indietro, azioni a destra.
 *
 * È chrome fisso: va passata a `Screen` come `header`, non messa nel flusso.
 * Il contenuto le scorre sotto e si vede sfocato — è ciò che rende il vetro
 * riconoscibile invece che una semplice trasparenza.
 *
 * Nell'header restano solo navigazione e azioni innocue. Ciò che elimina,
 * archivia o conclude sta altrove: in fondo, sotto il pollice, dove lo si
 * raggiunge di proposito e non per sbaglio con la mano che regge il telefono.
 */
export function ScreenHeader({
  title,
  subtitle,
  showBack,
  actions = [],
  below,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: HeaderAction[];
  /**
   * Riga agganciata sotto il titolo, dentro la stessa lastra: filtri, periodo,
   * ricerca. Sta qui e non in cima allo scroll perché è roba che si cambia
   * dopo aver guardato il contenuto, e inseguirla scorrendo all'insù è assurdo.
   */
  below?: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Glass
      level="high"
      elevation="mid"
      blur
      radius={0}
      sheen={false}
      style={[
        styles.root,
        {
          paddingTop: insets.top + theme.space.sm,
          paddingBottom: below ? theme.space.sm : theme.space.md,
          gap: theme.space.sm,
          borderTopWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
        },
      ]}>
      <View style={[styles.bar, { paddingHorizontal: theme.space.lg, gap: theme.space.sm }]}>
        {showBack ? (
          <IconButton icon="chevron-left" label="Indietro" size={30} onPress={() => router.back()} />
        ) : null}

        <View style={styles.titles}>
          <Text variant="title" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" tone="dim" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {actions.map((action) => (
          <IconButton
            key={action.label}
            icon={action.icon}
            label={action.label}
            onPress={action.onPress}
            surface
          />
        ))}
      </View>

      {below ? <View style={{ paddingBottom: theme.space.xs }}>{below}</View> : null}
    </Glass>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'column' },
  bar: { flexDirection: 'row', alignItems: 'center' },
  titles: { flex: 1, gap: 2 },
});
