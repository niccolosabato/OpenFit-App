import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
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

  const query = useMemo(() => exerciseQuery(id), [id]);
  const { data } = useLiveQuery(query, [id]);
  const exercise = data?.[0];

  if (!exercise) {
    return (
      <Screen padded={false}>
        <ScreenHeader title="Esercizio" showBack />
        <Text variant="caption" tone="dim" style={{ padding: theme.space.lg }}>
          Esercizio non trovato.
        </Text>
      </Screen>
    );
  }

  function confirmArchive() {
    Alert.alert(
      'Archiviare l’esercizio?',
      'Sparisce dalla libreria ma resta nelle sessioni già registrate, così lo storico non si rompe.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Archivia',
          style: 'destructive',
          onPress: () => {
            archiveExercise(exercise!.id);
            router.back();
          },
        },
      ],
    );
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
    <Screen padded={false}>
      <ScreenHeader
        title={exercise.name}
        subtitle={exercise.isCustom ? 'Esercizio personalizzato' : undefined}
        showBack
        actions={[
          {
            icon: exercise.isFavorite ? 'star' : 'star-outline',
            label: exercise.isFavorite ? 'Togli dai preferiti' : 'Aggiungi ai preferiti',
            onPress: () => toggleFavorite(exercise.id, !exercise.isFavorite),
          },
          { icon: 'archive-outline', label: 'Archivia', onPress: confirmArchive },
        ]}
      />

      <ScrollView
        contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.lg, paddingBottom: theme.space.xxxl }}>
        <Card>
          <View style={{ gap: theme.space.md }}>
            {facts.map((fact) => (
              <View key={fact.label} style={styles.factRow}>
                <Text variant="caption" tone="dim">
                  {fact.label}
                </Text>
                <Text variant="subtitle">{fact.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        {exercise.secondaryMuscles.length > 0 ? (
          <Card>
            <Text variant="label" tone="dim">
              Muscoli secondari
            </Text>
            <Text variant="body" style={{ marginTop: theme.space.sm }}>
              {exercise.secondaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
            </Text>
          </Card>
        ) : null}

        {exercise.aliases ? (
          <Card>
            <Text variant="label" tone="dim">
              Conosciuto anche come
            </Text>
            <Text variant="body" style={{ marginTop: theme.space.sm }}>
              {exercise.aliases.split(';').map((a) => a.trim()).filter(Boolean).join(' · ')}
            </Text>
          </Card>
        ) : null}

        {exercise.instructions ? (
          <Card>
            <Text variant="label" tone="dim">
              Note tecniche
            </Text>
            <Text variant="body" style={{ marginTop: theme.space.sm, lineHeight: 22 }}>
              {exercise.instructions}
            </Text>
          </Card>
        ) : null}

        <ExerciseSummary exercise={exercise} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  factRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
});
