import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { FloatingBand } from './floating-band';
import { IconButton } from './icon-button';
import { Text } from './text';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type HeaderAction = {
  icon: IconName;
  label: string;
  onPress: () => void;
  /** Tinge d'accento: l'azione che la schermata vuole far notare. */
  accent?: boolean;
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
  /**
   * `large` è il titolo di una destinazione — le cinque tab. `compact` è
   * quello di una pagina in cui si è entrati: lì accanto c'è già la freccia
   * indietro a dire dove si è, e un titolo da trenta punti con una freccia a
   * fianco sembra il titolo della freccia. Di default lo decide `showBack`.
   */
  size,
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
  size?: 'large' | 'compact';
}) {
  const theme = useTheme();
  const large = (size ?? (showBack ? 'compact' : 'large')) === 'large';

  return (
    <FloatingBand
      edge="top"
      surfaceStyle={{
        paddingVertical: theme.space.xs,
        paddingBottom: below ? theme.space.sm : theme.space.xs,
      }}>
      <View style={[styles.bar, { paddingHorizontal: theme.space.xs, gap: theme.space.xs }]}>
        {showBack ? (
          <IconButton icon="arrow-left" label="Indietro" size={24} onPress={() => router.back()} />
        ) : null}

        <View style={[styles.titles, !showBack && { paddingLeft: theme.space.md }]}>
          <Text variant={large ? 'title' : 'heading'} numberOfLines={1}>
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
            tone={action.accent ? 'accent' : 'dim'}
            surface
          />
        ))}
      </View>

      {below ? <View style={{ paddingTop: theme.space.xs }}>{below}</View> : null}
    </FloatingBand>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center' },
  // `space.xs` fra titolo e sottotitolo: è la distanza di ogni coppia
  // "riga principale + riga secondaria" dell'app.
  titles: { flex: 1, gap: 4, justifyContent: 'center' },
});
