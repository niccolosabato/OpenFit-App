import { router } from 'expo-router';

import { confirm } from '@/components/ui/confirm';
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

  confirm({
    title: 'C’è già un allenamento in corso',
    message: `"${active.name}" è ancora aperto. Vuoi riprenderlo o scartarlo e cominciarne uno nuovo?`,
    action: {
      label: 'Riprendi',
      onPress: () => router.push('/session/active'),
    },
    alternative: {
      label: 'Scarta e ricomincia',
      destructive: true,
      onPress: () => {
        abandonSession(active.id);
        begin();
        router.push('/session/active');
      },
    },
  });
}
