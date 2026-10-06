/**
 * Il ponte verso il modulo nativo della notifica di sessione.
 *
 * Non va importato direttamente: in Expo Go il modulo nativo non esiste e
 * `requireNativeModule` lancia al momento dell'import, portandosi dietro tutta
 * la catena fino al layout. Si carica in modo pigro da
 * `src/features/session/session-notification.ts`, con lo stesso schema di
 * `features/timer/local-notifications.ts`.
 */

import { requireNativeModule } from 'expo-modules-core';

export type SessionNotificationNativeModule = {
  /**
   * Mostra o aggiorna la notifica. Con `timestamp` (epoch ms) la notifica ha
   * il cronometro nativo; il verso lo sceglie `countdown`.
   */
  present: (
    title: string,
    body: string,
    timestamp: number | null,
    countdown: boolean,
  ) => Promise<void>;
  cancel: () => Promise<void>;
};

export default requireNativeModule<SessionNotificationNativeModule>('SessionNotification');