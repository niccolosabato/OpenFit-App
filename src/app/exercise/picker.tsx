/**
 * Selettore esercizi.
 *
 * È una rotta e non un componente modale perché expo-router non restituisce
 * valori: la schermata riceve la destinazione nei parametri, esegue lei
 * l'inserimento e torna indietro.
 */

import { router, useLocalSearchParams } from 'expo-router';

import { ExerciseList } from '@/components/exercise/exercise-list';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { addExerciseToDay } from '@/db/queries/routines';
import { addExerciseToSession } from '@/db/queries/sessions';

export default function ExercisePickerScreen() {
  const { dayId, sessionId } = useLocalSearchParams<{ dayId?: string; sessionId?: string }>();

  return (
    <Screen padded={false}>
      <ExerciseList
        header={<ScreenHeader title="Aggiungi esercizio" showBack />}
        showFavoriteToggle={false}
        onSelect={(exercise) => {
          if (dayId) addExerciseToDay(dayId, exercise.id);
          else if (sessionId) addExerciseToSession(sessionId, exercise.id);
          router.back();
        }}
        emptyAction={{ label: 'Crea un esercizio', onPress: () => router.push('/exercise/new') }}
      />
    </Screen>
  );
}
