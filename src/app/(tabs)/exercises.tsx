import { router } from 'expo-router';

import { ExerciseList } from '@/components/exercise/exercise-list';

export default function ExercisesScreen() {
  return (
    <ExerciseList
      title="Esercizi"
      actions={[
        { icon: 'plus', label: 'Nuovo esercizio', onPress: () => router.push('/exercise/new') },
        { icon: 'cog-outline', label: 'Profilo', onPress: () => router.push('/profile') },
      ]}
      onSelect={(exercise) =>
        router.push({ pathname: '/exercise/[id]', params: { id: exercise.id } })
      }
      emptyAction={{ label: 'Crea un esercizio', onPress: () => router.push('/exercise/new') }}
    />
  );
}
