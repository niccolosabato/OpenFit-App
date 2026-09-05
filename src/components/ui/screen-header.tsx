import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { Surface } from './surface';
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
 * Così resta ferma mentre il contenuto scorre, e le azioni non se ne vanno
 * insieme alla lista.
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
   * Riga agganciata sotto il titolo, dentro la stessa barra: filtri, periodo,
   * ricerca. Sta qui e non in cima allo scroll perché è roba che si cambia
   * dopo aver guardato il contenuto, e inseguirla scorrendo all'insù è assurdo.
   */
  below?: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    // Due strati: una fascia opaca del colore del fondo, che copre il
    // contenuto che le scorre sotto, e dentro la barra vera, arrotondata e
    // staccata dai bordi.
    <View
      style={[
        styles.band,
        {
          backgroundColor: theme.colors.bg,
          paddingTop: insets.top + theme.floatInset,
          paddingHorizontal: theme.floatInset,
          paddingBottom: theme.floatInset,
        },
      ]}>
      <Surface
        level="low"
        elevation="float"
        radius={theme.radius.xl}
        style={{ paddingVertical: below ? theme.space.sm : theme.space.xs }}>
        <View style={[styles.bar, { paddingHorizontal: theme.space.sm, gap: theme.space.sm }]}>
          {showBack ? (
            <IconButton icon="chevron-left" label="Indietro" size={30} onPress={() => router.back()} />
          ) : null}

          <View style={[styles.titles, !showBack && { paddingLeft: theme.space.sm }]}>
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

        {below ? <View style={{ paddingTop: theme.space.sm }}>{below}</View> : null}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { flexDirection: 'column' },
  bar: { flexDirection: 'row', alignItems: 'center' },
  titles: { flex: 1, gap: 4 },
});
