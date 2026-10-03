/**
 * Selettore esercizi.
 *
 * È una rotta e non un componente modale perché expo-router non restituisce
 * valori: la schermata riceve la destinazione nei parametri, esegue lei
 * l'inserimento e torna indietro.
 *
 * La selezione è multipla: si spuntano tutti gli esercizi del giorno e si
 * conferma una volta sola. Prima era singola, e riempire un giorno da sei
 * esercizi voleva dire sei andate e ritorni con i filtri da rifare ogni volta.
 */

import { router, useLocalSearchParams } from 'expo-router';

import { ExerciseList } from '@/components/exercise/exercise-list';
import { addExerciseToDay, updateRoutineExercise } from '@/db/queries/routines';
import { addExerciseToSession, updateSessionExercise } from '@/db/queries/sessions';

export default function ExercisePickerScreen() {
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

  // In sostituzione si tocca un esercizio solo e si torna indietro: niente
  // selezione multipla né barra di conferma.
  const replacing = Boolean(replaceSessionExerciseId || replaceRoutineExerciseId);

  function replace(exerciseId: string) {
    if (replaceSessionExerciseId) updateSessionExercise(replaceSessionExerciseId, { exerciseId });
    else if (replaceRoutineExerciseId) updateRoutineExercise(replaceRoutineExerciseId, { exerciseId });
    router.back();
  }

  // Il "+" porta con sé la destinazione, così anche l'esercizio creato al volo
  // viene aggiunto o messo al posto di quello di partenza.
  const target: Record<string, string> = {};
  if (dayId) target.dayId = dayId;
  if (sessionId) target.sessionId = sessionId;
  if (replaceSessionExerciseId) target.replaceSessionExerciseId = replaceSessionExerciseId;
  if (replaceRoutineExerciseId) target.replaceRoutineExerciseId = replaceRoutineExerciseId;

  return (
    <ExerciseList
      title={replacing ? 'Sostituisci esercizio' : 'Aggiungi esercizio'}
      showBack
      showFavoriteToggle={false}
      actions={[
        {
          icon: 'plus',
          label: 'Nuovo esercizio',
          onPress: () => router.push({ pathname: '/exercise/new', params: target }),
        },
      ]}
      onSelect={replacing ? (exercise) => replace(exercise.id) : undefined}
      selection={
        replacing
          ? undefined
          : {
              label: (count) =>
                count === 0 ? 'Scegli gli esercizi' : count === 1 ? 'Aggiungi 1 esercizio' : `Aggiungi ${count} esercizi`,
              onConfirm: (ids) => {
                // Una chiamata per esercizio: ognuna ricalcola il proprio indice di
                // ordinamento, quindi l'ordine di scelta viene rispettato.
                for (const id of ids) {
                  if (dayId) addExerciseToDay(dayId, id);
                  else if (sessionId) addExerciseToSession(sessionId, id);
                }
                router.back();
              },
            }
      }
      emptyAction={{
        label: 'Crea un esercizio',
        onPress: () => router.push({ pathname: '/exercise/new', params: target }),
      }}
    />
  );
}
