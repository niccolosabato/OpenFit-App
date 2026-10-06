/**
 * Il contenuto della notifica fissa dell'allenamento.
 *
 * Logica pura, separata dal modulo nativo e dallo store: qui si decide solo
 * *cosa* deve dire la notifica in base allo stato della sessione e del timer.
 * Chi la mostra — e chi la cancella quando non c'è più una seduta — è
 * `src/features/session/session-notification.ts`.
 *
 * Il countdown non compare nel testo: quando c'è un `timestamp` futuro è
 * Android a disegnarlo con il cronometro nativo, che scorre da solo anche ad
 * app sospesa. Il testo resta fermo per tutta la durata del recupero.
 */

import { formatDuration } from './format';

export type NotificationTimer = {
  endsAt: number | null;
  pausedRemaining: number | null;
  label: string | null;
  kind: 'rest' | 'timer';
};

export type SessionNotificationContent = {
  title: string;
  body: string;
  /** Istante di fine in epoch ms per il cronometro; `null` senza countdown. */
  timestamp: number | null;
};

/**
 * `null` quando non c'è una sessione attiva: la notifica va tolta.
 *
 * `now` è un parametro e non `Date.now()` perché un recupero scaduto mentre il
 * telefono era in tasca non è più un countdown, e questa transizione va potuta
 * provare senza aspettare davvero.
 */
export function sessionNotificationContent(
  sessionName: string | null,
  timer: NotificationTimer,
  now: number,
): SessionNotificationContent | null {
  if (sessionName === null) return null;

  if (timer.endsAt !== null && timer.endsAt > now) {
    return timer.kind === 'timer'
      ? { title: 'Timer', body: 'Timer libero', timestamp: timer.endsAt }
      : {
          title: 'Recupero',
          body: timer.label ?? 'Recupero in corso',
          timestamp: timer.endsAt,
        };
  }

  if (timer.pausedRemaining !== null) {
    return {
      title: timer.kind === 'timer' ? 'Timer in pausa' : 'Recupero in pausa',
      body: `In pausa · ${formatDuration(timer.pausedRemaining)}`,
      timestamp: null,
    };
  }

  return { title: 'Allenamento in corso', body: sessionName, timestamp: null };
}