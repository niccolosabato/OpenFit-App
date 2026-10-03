import { router, useLocalSearchParams } from 'expo-router';

import {
  EMPTY_EXERCISE_DRAFT,
  ExerciseForm,
} from '@/components/exercise/exercise-form';
import { createCustomExercise } from '@/db/queries/exercises';
import { addExerciseToDay, updateRoutineExercise } from '@/db/queries/routines';
import { addExerciseToSession, updateSessionExercise } from '@/db/queries/sessions';

export default function NewExerciseScreen() {
  const {
    dayId,
    sessionId,
    replaceSessionExerciseId,
    replaceRoutineExerciseId,
  } = useLocalSearchParams<{
    dayId?: string;
    sessionId?: string;
    replaceSessionExerciseId?: string;
    replaceRoutineExerciseId?: string;
  }>();

  return (
    <ExerciseForm
      title="Nuovo esercizio"
      submitLabel="Salva esercizio"
      footnote="Gli esercizi personalizzati non vengono mai sovrascritti dagli aggiornamenti."
      initial={EMPTY_EXERCISE_DRAFT}
      onSubmit={(values) => {
        const id = createCustomExercise({ ...values, secondaryMuscles: [] });

        if (replaceSessionExerciseId) {
          updateSessionExercise(replaceSessionExerciseId, { exerciseId: id });
          router.dismiss(2);
        } else if (replaceRoutineExerciseId) {
          updateRoutineExercise(replaceRoutineExerciseId, { exerciseId: id });
          router.dismiss(2);
        } else if (sessionId) {
          addExerciseToSession(sessionId, id);
          router.dismiss(2);
        } else if (dayId) {
          addExerciseToDay(dayId, id);
          router.dismiss(2);
        } else {
          router.replace({ pathname: '/exercise/[id]', params: { id } });
        }
      }}
    />
  );
}
