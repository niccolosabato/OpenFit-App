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
import { addExerciseToDay } from '@/db/queries/routines';
import { addExerciseToSession } from '@/db/queries/sessions';

export default function ExercisePickerScreen() {
  const { dayId, sessionId } = useLocalSearchParams<{ dayId?: string; sessionId?: string }>();

  return (
    <ExerciseList
      title="Aggiungi esercizio"
      showBack
      showFavoriteToggle={false}
      selection={{
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
      }}
      emptyAction={{ label: 'Crea un esercizio', onPress: () => router.push('/exercise/new') }}
    />
  );
}
