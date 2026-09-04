import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Sheet, SheetAction } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/field';
import { createRoutine, routineListQuery } from '@/db/queries/routines';
import { ROUTINE_TEMPLATES, createRoutineFromTemplate } from '@/db/seed/templates';
import { useTheme } from '@/theme';

export default function RoutinesScreen() {
  const theme = useTheme();
  const { data } = useLiveQuery(routineListQuery());
  const routines = data ?? [];

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
      header={<ScreenHeader title="Schede" actions={[{ icon: 'cog-outline', label: 'Profilo', onPress: () => router.push('/profile') }]} />}
      // "Parti da un modello" stava in fondo alla lista: con qualche scheda
      // già creata bisognava scorrere per trovarlo. Ora è sempre qui.
      actionBar={
        <ActionBar safeBottom={false}>
          <View style={{ flex: 1 }}>
            <Button title="Nuova scheda" fullWidth onPress={() => setNewOpen(true)} />
          </View>
          <Button
            title="Modelli"
            variant="secondary"
            onPress={() => setTemplatesOpen(true)}
          />
        </ActionBar>
      }>
      {routines.length === 0 ? (
        <EmptyState
          icon="clipboard-list-outline"
          title="Nessuna scheda"
          description="Parti da una struttura già pronta e aggiustala, oppure costruiscine una da zero."
          actionLabel="Parti da un modello"
          onAction={() => setTemplatesOpen(true)}
        />
      ) : (
        <ScreenScroll gap={theme.space.md}>
          {routines.map((routine) => (
            <Card key={routine.id} onPress={() => openRoutine(routine.id)}>
              <View style={{ gap: 4 }}>
                <Text variant="heading" numberOfLines={1}>
                  {routine.name}
                </Text>
                {routine.notes ? (
                  <Text variant="caption" tone="dim" numberOfLines={2}>
                    {routine.notes}
                  </Text>
                ) : null}
              </View>
            </Card>
          ))}
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
            onPress={() => {
              setTemplatesOpen(false);
              openRoutine(createRoutineFromTemplate(template));
            }}>
            <View style={{ gap: theme.space.sm }}>
              <View style={styles.templateHead}>
                <Text variant="heading">{template.name}</Text>
                <Chip label={template.level} compact />
              </View>
              <Text variant="caption" tone="dim">
                {template.description}
              </Text>
              <Text variant="caption" tone="faint">
                {template.frequency} · {template.days.length}{' '}
                {template.days.length === 1 ? 'giorno' : 'giorni'}
              </Text>
            </View>
          </Card>
        ))}
      </Sheet>

      <Sheet visible={newOpen} onClose={() => setNewOpen(false)} title="Nuova scheda" scrollable={false}>
        <TextField
          label="Nome"
          value={newName}
          onChangeText={setNewName}
          placeholder="Es. Push Pull Legs — autunno"
          autoFocus
        />
        <Button title="Crea" onPress={confirmCreate} fullWidth />
        <SheetAction label="Annulla" onPress={() => setNewOpen(false)} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  templateHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
