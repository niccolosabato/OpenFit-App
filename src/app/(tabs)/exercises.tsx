import { router } from 'expo-router';

import { ExerciseList } from '@/components/exercise/exercise-list';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';

export default function ExercisesScreen() {
  return (
    <Screen padded={false}>
      <ExerciseList
        header={
          <ScreenHeader
            title="Esercizi"
            actions={[
              {
                icon: 'plus',
                label: 'Nuovo esercizio',
                onPress: () => router.push('/exercise/new'),
              },
            ]}
          />
        }
        onSelect={(exercise) => router.push({ pathname: '/exercise/[id]', params: { id: exercise.id } })}
        emptyAction={{ label: 'Crea un esercizio', onPress: () => router.push('/exercise/new') }}
      />
    </Screen>
  );
}
