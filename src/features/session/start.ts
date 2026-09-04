import { router } from 'expo-router';
import { Alert } from 'react-native';

import { getActiveSession } from '@/db/queries/sessions';
import { abandonSession } from './actions';

/**
 * Avvia un allenamento, gestendo il caso in cui ce ne sia già uno aperto.
 *
 * Una sessione attiva alla volta è un invariante dello schema. Invece di
 * sostituirla in silenzio — buttando via lavoro già registrato — si chiede:
 * quasi sempre l'utente vuole *riprendere* quella, non ricominciare.
 */
export function startWorkout(begin: () => string): void {
  const active = getActiveSession();

  if (!active) {
    begin();
    router.push('/session/active');
    return;
  }

  Alert.alert(
    'C’è già un allenamento in corso',
    `"${active.name}" è ancora aperto. Vuoi riprenderlo o scartarlo e cominciarne uno nuovo?`,
    [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Riprendi',
        onPress: () => router.push('/session/active'),
      },
      {
        text: 'Scarta e ricomincia',
        style: 'destructive',
        onPress: () => {
          abandonSession(active.id);
          begin();
          router.push('/session/active');
        },
      },
    ],
  );
}
