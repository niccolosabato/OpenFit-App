/**
 * La notifica fissa dell'allenamento in corso.
 *
 * Una notifica "ongoing" che resta per tutta la seduta e, quando parte un
 * recupero, porta il countdown. Il countdown lo disegna Android con il
 * cronometro nativo, quindi scorre anche ad app sospesa senza che il
 * JavaScript resti vivo: non serve un foreground service.
 *
 * `expo-notifications` non sa fare né una notifica ongoing né un cronometro,
 * per questo c'è un modulo nativo locale — `modules/session-notification` —
 * e l'accesso è pigro come in `features/timer/local-notifications.ts`: in Expo
 * Go il modulo nativo non esiste e `requireNativeModule` lancerebbe
 * all'import, portandosi dietro tutta l'app.
 */

import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { activeSessionQuery, getActiveSession } from '@/db/queries/sessions';
import { useRestTimer } from '@/features/timer/rest-timer';
import { sessionNotificationContent } from '@/lib/session-notification';

type SessionNotificationModule = {
  present: (
    title: string,
    body: string,
    timestamp: number | null,
    countdown: boolean,
  ) => Promise<void>;
  cancel: () => Promise<void>;
};

const NATIVE_AVAILABLE =
  Platform.OS === 'android' &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

/** `undefined` = mai tentato, `null` = tentato e non disponibile. */
let cached: SessionNotificationModule | null | undefined;

function load(): SessionNotificationModule | null {
  if (cached !== undefined) return cached;

  if (!NATIVE_AVAILABLE) {
    cached = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('../../../modules/session-notification') as {
      default: SessionNotificationModule;
    };
    cached = loaded.default;
  } catch {
    cached = null;
  }

  return cached;
}

/**
 * Allinea la notifica allo stato corrente.
 *
 * Va chiamata sia dai cambi reattivi (vedi `useSessionNotification`) sia al
 * ritorno in primo piano: `dismissPresented` porta via anche questa notifica,
 * perché la tendina è una sola, e subito dopo va rimessa dov'era.
 */
export function syncSessionNotification(): void {
  const native = load();
  if (!native) return;

  try {
    const session = getActiveSession();
    const content = sessionNotificationContent(
      session?.name ?? null,
      useRestTimer.getState(),
      Date.now(),
    );

    if (!content) {
      native.cancel().catch(() => {});
      return;
    }

    // Il verso del cronometro è sempre il countdown: l'unico caso con un
    // timestamp è il recupero, che deve mostrare quanto manca.
    native.present(content.title, content.body, content.timestamp, true).catch(() => {});
  } catch {
    // Una notifica non vale un crash: se lo stato non è leggibile si resta
    // senza, come se il modulo nativo non ci fosse.
  }
}

/**
 * Tiene la notifica allineata mentre l'app è viva: avvio e fine sessione,
 * avvio e fine recupero, pausa e ripresa passano tutti da qui.
 *
 * La lista di dipendenze è di primitive apposta: gli oggetti dello store
 * cambiano identità a ogni aggiornamento e farebbero ripartire la
 * sincronizzazione anche quando non è cambiato niente da mostrare.
 */
export function useSessionNotification(): void {
  const { data } = useLiveQuery(activeSessionQuery());
  const sessionName = data?.[0]?.name ?? null;
  const endsAt = useRestTimer((state) => state.endsAt);
  const pausedRemaining = useRestTimer((state) => state.pausedRemaining);
  const label = useRestTimer((state) => state.label);
  const kind = useRestTimer((state) => state.kind);

  useEffect(() => {
    syncSessionNotification();
  }, [sessionName, endsAt, pausedRemaining, label, kind]);
}