/**
 * Timer di recupero.
 *
 * Due scelte portano tutto il peso:
 *
 * 1. **Lo stato è un istante di fine (`endsAt`), non un contatore.** Un
 *    `setInterval` che decrementa perde tempo appena il telefono sospende
 *    l'app — e fra una serie e l'altra il telefono va in tasca di sicuro.
 *    Ricalcolando dal timestamp, il recupero resta esatto al ritorno.
 *
 * 2. **Una notifica locale è schedulata sull'istante di fine.** È l'unico modo
 *    perché il recupero suoni a schermo bloccato: il JavaScript non gira.
 *    Se l'utente torna prima, la notifica viene annullata.
 */

import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { create } from 'zustand';

export const REST_NOTIFICATION_CHANNEL = 'rest-timer';

/** Di quanto aggiustano i tasti +/− sul countdown. */
export const REST_ADJUST_STEP = 15;

type RestTimerState = {
  /** Istante di fine in epoch ms; `null` se non c'è nessun recupero in corso. */
  endsAt: number | null;
  /** Durata impostata all'avvio, per disegnare la barra di avanzamento. */
  duration: number;
  /** Nome dell'esercizio da cui si sta recuperando. */
  label: string | null;
  /** Notifica schedulata, da annullare se il recupero finisce prima. */
  notificationId: string | null;

  start: (seconds: number, label: string | null, options: TimerOptions) => void;
  adjust: (deltaSeconds: number, options: TimerOptions) => void;
  stop: () => void;
};

export type TimerOptions = {
  sound: boolean;
  notify: boolean;
};

/** Su Android una notifica deve appartenere a un canale per poter suonare. */
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REST_NOTIFICATION_CHANNEL, {
    name: 'Timer di recupero',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 150, 250],
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

/**
 * Chiede il permesso alle notifiche.
 *
 * Si chiama alla prima partenza del timer e non all'avvio dell'app: il
 * permesso ha senso solo quando si capisce a cosa serve.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

async function scheduleEndNotification(
  seconds: number,
  label: string | null,
  sound: boolean,
): Promise<string | null> {
  if (seconds <= 0) return null;
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;
    await ensureNotificationChannel();

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Recupero finito',
        body: label ? `Torna sotto: ${label}` : 'Torna sotto.',
        sound,
        vibrate: [0, 250, 150, 250],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        channelId: REST_NOTIFICATION_CHANNEL,
      },
    });
  } catch {
    // Notifiche non disponibili (permesso negato, Expo Go limitato): il timer
    // resta comunque valido finché l'app è in primo piano.
    return null;
  }
}

function cancel(notificationId: string | null): void {
  if (!notificationId) return;
  Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});
}

export const useRestTimer = create<RestTimerState>((set, get) => ({
  endsAt: null,
  duration: 0,
  label: null,
  notificationId: null,

  start: (seconds, label, options) => {
    cancel(get().notificationId);

    if (seconds <= 0) {
      set({ endsAt: null, duration: 0, label: null, notificationId: null });
      return;
    }

    set({ endsAt: Date.now() + seconds * 1000, duration: seconds, label, notificationId: null });

    if (options.notify) {
      scheduleEndNotification(seconds, label, options.sound).then((id) => {
        // Se nel frattempo il recupero è stato saltato, la notifica non serve più.
        if (get().endsAt === null) cancel(id);
        else set({ notificationId: id });
      });
    }
  },

  adjust: (deltaSeconds, options) => {
    const { endsAt, duration, label, notificationId } = get();
    if (endsAt === null) return;

    const nextEndsAt = endsAt + deltaSeconds * 1000;
    const remaining = Math.round((nextEndsAt - Date.now()) / 1000);

    cancel(notificationId);

    if (remaining <= 0) {
      set({ endsAt: null, duration: 0, label: null, notificationId: null });
      return;
    }

    set({
      endsAt: nextEndsAt,
      duration: Math.max(duration + deltaSeconds, remaining),
      notificationId: null,
    });

    if (options.notify) {
      scheduleEndNotification(remaining, label, options.sound).then((id) => {
        if (get().endsAt === null) cancel(id);
        else set({ notificationId: id });
      });
    }
  },

  stop: () => {
    cancel(get().notificationId);
    set({ endsAt: null, duration: 0, label: null, notificationId: null });
  },
}));

/** Vibrazione di conferma quando si spunta una serie. */
export function tapFeedback(enabled: boolean): void {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Vibrazione più marcata a fine recupero. */
export function restFinishedFeedback(enabled: boolean): void {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
