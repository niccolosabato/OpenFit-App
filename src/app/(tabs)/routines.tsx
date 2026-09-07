import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Sheet } from '@/components/ui/sheet';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/field';
import { createRoutine, routineDayCountsQuery, routineListQuery } from '@/db/queries/routines';
import { ROUTINE_TEMPLATES, createRoutineFromTemplate } from '@/db/seed/templates';
import { pluralize } from '@/lib/format';
import { useTheme } from '@/theme';

export default function RoutinesScreen() {
  const theme = useTheme();
  const { data } = useLiveQuery(routineListQuery());
  const { data: dayCountRows } = useLiveQuery(routineDayCountsQuery());
  const routines = data ?? [];

  const daysByRoutine = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of dayCountRows ?? []) map.set(row.routineId, row.days);
    return map;
  }, [dayCountRows]);

  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');

  function openRoutine(id: string) {
    router.push({ pathname: '/routine/[id]', params: { id } });
  }

  function confirmCreate() {
    const name = newName.trim() || 'Nuova scheda';
    setNewOpen(false);
    setNewName('');
    openRoutine(createRoutine(name));
  }

  return (
    <Screen
      padded={false}
      header={
        <ScreenHeader
          title="Schede"
          actions={[{ icon: 'cog-outline', label: 'Profilo', onPress: () => router.push('/profile') }]}
        />
      }
      // "Parti da un modello" stava in fondo alla lista: con qualche scheda
      // già creata bisognava scorrere per trovarlo. Ora è sempre qui.
      actionBar={
        <ActionBar safeBottom={false}>
          <View style={{ flex: 1 }}>
            <Button
              title="Nuova scheda"
              fullWidth
              icon={<MaterialCommunityIcons name="plus" size={18} color={theme.colors.onAccent} />}
              onPress={() => setNewOpen(true)}
            />
          </View>
          <Button title="Modelli" variant="secondary" onPress={() => setTemplatesOpen(true)} />
        </ActionBar>
      }>
      {routines.length === 0 ? (
        <EmptyState
          icon="clipboard-text-outline"
          title="Nessuna scheda"
          description="Parti da una struttura già pronta e aggiustala, oppure costruiscine una da zero."
          actionLabel="Parti da un modello"
          onAction={() => setTemplatesOpen(true)}
        />
      ) : (
        <ScreenScroll gap={theme.space.md} showsVerticalScrollIndicator={false}>
          {routines.map((routine, index) => {
            const days = daysByRoutine.get(routine.id) ?? 0;

            return (
              <Animated.View
                key={routine.id}
                entering={FadeInDown.delay(index * 40).duration(theme.motion.duration.slow)}>
                <Card padded={false} onPress={() => openRoutine(routine.id)}>
                  <View style={[styles.row, { padding: theme.space.lg, gap: theme.space.lg }]}>
                    {/* Il quadratino con il numero di giorni: la sola cosa che
                        distingue due schede a colpo d'occhio quando i nomi si
                        somigliano ("PPL autunno", "PPL inverno"). */}
                    <Surface level="mid" radius={theme.radius.md} style={styles.badge}>
                      <Text variant="metric" tone="accent" numeric>
                        {days}
                      </Text>
                      <Text variant="label" tone="faint">
                        {days === 1 ? 'giorno' : 'giorni'}
                      </Text>
                    </Surface>

                    <View style={{ flex: 1, gap: theme.space.xs }}>
                      <Text variant="heading" numberOfLines={1}>
                        {routine.name}
                      </Text>
                      <Text variant="caption" tone="dim" numberOfLines={2}>
                        {routine.notes || 'Nessuna nota'}
                      </Text>
                    </View>

                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={22}
                      color={theme.colors.textFaint}
                    />
                  </View>
                </Card>
              </Animated.View>
            );
          })}
        </ScreenScroll>
      )}

      <Sheet
        visible={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        title="Modelli"
        subtitle="Una volta creata, la scheda è tua: modificala come vuoi.">
        {ROUTINE_TEMPLATES.map((template) => (
          <Card
            key={template.id}
            level="top"
            onPress={() => {
              setTemplatesOpen(false);
              openRoutine(createRoutineFromTemplate(template));
            }}>
            <View style={{ gap: theme.space.sm }}>
              <Text variant="heading" numberOfLines={1}>
                {template.name}
              </Text>
              <Text variant="caption" tone="dim">
                {template.description}
              </Text>
              <Text variant="caption" tone="faint">
                {template.frequency} · {pluralize(template.days.length, 'giorno', 'giorni')}
              </Text>
            </View>
          </Card>
        ))}
      </Sheet>

      <Sheet
        visible={newOpen}
        onClose={() => setNewOpen(false)}
        title="Nuova scheda"
        scrollable={false}
        // Conferma e annullamento stanno nel piede, sulla stessa riga: prima
        // "Annulla" era una voce di menu allineata a sinistra sotto un pulsante
        // centrato, e si vedeva che erano due cose diverse messe vicine.
        footer={
          <View style={[styles.sheetActions, { gap: theme.space.sm }]}>
            <Button title="Annulla" variant="ghost" onPress={() => setNewOpen(false)} />
            <View style={{ flex: 1 }}>
              <Button title="Crea" onPress={confirmCreate} fullWidth />
            </View>
          </View>
        }>
        <TextField
          label="Nome"
          value={newName}
          onChangeText={setNewName}
          placeholder="Es. Push Pull Legs — autunno"
          autoFocus
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', gap: 1 },
  sheetActions: { flexDirection: 'row', alignItems: 'center' },
});
