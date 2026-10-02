import { router } from 'expo-router';

import {
  EMPTY_EXERCISE_DRAFT,
  ExerciseForm,
} from '@/components/exercise/exercise-form';
import { createCustomExercise } from '@/db/queries/exercises';

export default function NewExerciseScreen() {
  return (
    <ExerciseForm
      title="Nuovo esercizio"
      submitLabel="Salva esercizio"
      footnote="Gli esercizi personalizzati non vengono mai sovrascritti dagli aggiornamenti."
      initial={EMPTY_EXERCISE_DRAFT}
      onSubmit={(values) => {
        const id = createCustomExercise({ ...values, secondaryMuscles: [] });
        router.replace({ pathname: '/exercise/[id]', params: { id } });
      }}
    />
  );
}
