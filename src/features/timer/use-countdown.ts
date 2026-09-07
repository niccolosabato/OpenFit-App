import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useSettings } from '@/store/settings';
import { restFinishedFeedback, useRestTimer } from './rest-timer';

/**
 * Secondi che mancano al termine del recupero.
 *
 * Il valore è sempre ricalcolato da `endsAt`: il tick serve solo a far
 * ridisegnare la UI, non a tenere il conto. Per questo tornare dall'app in
 * background non sfasa nulla, e si aggiorna anche al risveglio.
 *
 * In pausa non c'è nessun `endsAt` da ricalcolare: il residuo è quello
 * congelato al momento della pausa, e non serve nessun tick a tenerlo vivo.
 */
export function useRestCountdown(): {
  remaining: number;
  total: number;
  running: boolean;
  paused: boolean;
} {
  const endsAt = useRestTimer((s) => s.endsAt);
  const pausedRemaining = useRestTimer((s) => s.pausedRemaining);
  const duration = useRestTimer((s) => s.duration);
  const stop = useRestTimer((s) => s.stop);
  const { settings } = useSettings();

  const [, forceRender] = useState(0);
  const firedRef = useRef(false);

  useEffect(() => {
    if (endsAt === null) {
      firedRef.current = false;
      return;
    }

    const tick = () => forceRender((n) => n + 1);
    const interval = setInterval(tick, 250);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [endsAt]);

  const paused = pausedRemaining !== null;
  const remaining = paused
    ? pausedRemaining
    : endsAt === null
      ? 0
      : Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

  useEffect(() => {
    if (endsAt === null || remaining > 0 || firedRef.current) return;
    firedRef.current = true;
    restFinishedFeedback(settings.timerVibration);
    // Il countdown si spegne da solo: lasciarlo a zero lascerebbe una barra
    // ferma sullo schermo che non vuol dire più niente.
    stop();
  }, [endsAt, remaining, settings.timerVibration, stop]);

  return { remaining, total: duration, running: endsAt !== null || paused, paused };
}
