import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Tag } from '@/components/ui/chip';
import { confirm } from '@/components/ui/confirm';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Divider, Section } from '@/components/ui/section';
import { Sheet, SheetAction } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import {
  EQUIPMENT_LABELS,
  MECHANIC_LABELS,
  MUSCLE_LABELS,
  TRACKING_TYPE_LABELS,
} from '@/db/enums';
import { archiveExercise, exerciseQuery, toggleFavorite } from '@/db/queries/exercises';
import { ExerciseSummary } from '@/features/stats/exercise-summary';
import { formatRest } from '@/lib/format';
import { useTheme } from '@/theme';

export default function ExerciseDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [menuOpen, setMenuOpen] = useState(false);

  const query = useMemo(() => exerciseQuery(id), [id]);
  const { data } = useLiveQuery(query, [id]);
  const exercise = data?.[0];

  if (!exercise) {
    return (
      <Screen padded={false} header={<ScreenHeader title="Esercizio" showBack />}>
        <Text variant="caption" tone="dim" style={{ padding: theme.space.lg }}>
          Esercizio non trovato.
        </Text>
      </Screen>
    );
  }

  function confirmArchive() {
    confirm({
      title: 'Archiviare l’esercizio?',
      message:
        'Sparisce dalla libreria ma resta nelle sessioni già registrate, così lo storico non si rompe.',
      action: {
        label: 'Archivia',
        destructive: true,
        onPress: () => {
          archiveExercise(exercise!.id);
          router.back();
        },
      },
    });
  }

  const facts: { label: string; value: string }[] = [
    { label: 'Muscolo principale', value: MUSCLE_LABELS[exercise.primaryMuscle] },
    { label: 'Attrezzo', value: EQUIPMENT_LABELS[exercise.equipment] },
    { label: 'Movimento', value: MECHANIC_LABELS[exercise.mechanic] },
    { label: 'Misurazione', value: TRACKING_TYPE_LABELS[exercise.trackingType] },
    {
      label: 'Recupero predefinito',
      value: exercise.defaultRestSeconds ? formatRest(exercise.defaultRestSeconds) : 'globale',
    },
  ];

  return (
    <Screen
      padded={false}
      header={
        <ScreenHeader
          title={exercise.name}
          subtitle={exercise.isCustom ? 'Esercizio personalizzato' : undefined}
          showBack
          // Il preferito resta: non fa danni. L'archiviazione scende nel menu.
          actions={[
            {
              icon: exercise.isFavorite ? 'star' : 'star-outline',
              label: exercise.isFavorite ? 'Togli dai preferiti' : 'Aggiungi ai preferiti',
              accent: exercise.isFavorite,
              onPress: () => toggleFavorite(exercise.id, !exercise.isFavorite),
            },
            { icon: 'dots-horizontal', label: 'Opzioni', onPress: () => setMenuOpen(true) },
          ]}
        />
      }>
      <ScreenScroll gap={theme.space.lg}>
        {/* La scheda tecnica come elenco e non come griglia di coppie: le
            etichette sono lunghe ("Recupero predefinito") e affiancate al
            valore finivano su due righe una sì e una no. */}
        <Card padded={false}>
          {facts.map((fact, index) => (
            <View key={fact.label}>
              {index > 0 ? <Divider inset={theme.space.lg} /> : null}
              <View style={[styles.factRow, { padding: theme.space.lg, gap: theme.space.md }]}>
                <Text variant="body" tone="dim" style={{ flex: 1 }}>
                  {fact.label}
                </Text>
                <Text variant="subtitle" style={styles.factValue}>
                  {fact.value}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {exercise.secondaryMuscles.length > 0 ? (
          <View style={{ gap: theme.space.sm }}>
            <Section title="Muscoli secondari" style={{ paddingHorizontal: theme.space.xs }} />
            <View style={[styles.tags, { gap: theme.space.sm }]}>
              {exercise.secondaryMuscles.map((m) => (
                <Tag key={m} label={MUSCLE_LABELS[m]} />
              ))}
            </View>
          </View>
        ) : null}

        {exercise.aliases ? (
          <View style={{ gap: theme.space.sm }}>
            <Section title="Conosciuto anche come" style={{ paddingHorizontal: theme.space.xs }} />
            <Card>
              <Text variant="body" tone="dim">
                {exercise.aliases.split(';').map((a) => a.trim()).filter(Boolean).join(' · ')}
              </Text>
            </Card>
          </View>
        ) : null}

        {exercise.instructions ? (
          <View style={{ gap: theme.space.sm }}>
            <Section title="Note tecniche" style={{ paddingHorizontal: theme.space.xs }} />
            <Card>
              <Text
                variant="body"
                tone="dim"
                style={{ lineHeight: theme.font.size.md * theme.font.lineHeight.normal }}>
                {exercise.instructions}
              </Text>
            </Card>
          </View>
        ) : null}

        <ExerciseSummary exercise={exercise} />
      </ScreenScroll>

      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)} title={exercise.name} scrollable={false}>
        <SheetAction
          label="Archivia l’esercizio"
          description="Sparisce dalla libreria; lo storico resta."
          destructive
          onPress={() => {
            setMenuOpen(false);
            confirmArchive();
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  factRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  factValue: { textAlign: 'right', flexShrink: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap' },
});
