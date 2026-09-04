/**
 * Accesso alle notifiche locali, tollerante alla loro assenza.
 *
 * Da SDK 53 **Expo Go su Android non contiene più il modulo delle notifiche**,
 * e il solo `import 'expo-notifications'` lancia in cima al file — facendo
 * cadere l'intera catena di import fino al layout, quindi tutta l'app.
 *
 * Per questo il modulo si carica in modo pigro, con `require` dentro un
 * `try`, e solo dove ha senso provarci. Quando non c'è, il timer continua a
 * funzionare in primo piano (countdown e vibrazione): si perde solo il suono
 * a schermo bloccato.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

export const REST_NOTIFICATION_CHANNEL = 'rest-timer';

/**
 * `StoreClient` è Expo Go. In una development build o nell'APK il modulo c'è
 * e le notifiche funzionano normalmente.
 */
export const NOTIFICATIONS_AVAILABLE =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

/** `undefined` = mai tentato, `null` = tentato e non disponibile. */
let cached: NotificationsModule | null | undefined;
let handlerConfigured = false;

function load(): NotificationsModule | null {
  if (cached !== undefined) return cached;

  if (!NOTIFICATIONS_AVAILABLE) {
    cached = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsModule;
  } catch {
    cached = null;
    return null;
  }

  if (!handlerConfigured) {
    handlerConfigured = true;
    // Come si comporta una notifica che arriva ad app aperta: il suono sì — è
    // il segnale che il recupero è finito — ma niente banner, perché la
    // schermata mostra già il countdown e coprire i campi mentre si registra
    // una serie sarebbe solo fastidioso.
    cached.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      }),
    });
  }

  return cached;
}

/** Su Android una notifica deve appartenere a un canale per poter suonare. */
async function ensureChannel(module: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await module.setNotificationChannelAsync(REST_NOTIFICATION_CHANNEL, {
    name: 'Timer di recupero',
    importance: module.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 150, 250],
    sound: 'default',
    lockscreenVisibility: module.AndroidNotificationVisibility.PUBLIC,
  });
}

/**
 * Chiede il permesso alle notifiche.
 *
 * Si chiama alla prima partenza del timer e non all'avvio dell'app: il
 * permesso ha senso solo quando si capisce a cosa serve.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const module = load();
  if (!module) return false;

  try {
    const current = await module.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await module.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/**
 * Programma la notifica di fine recupero.
 * Restituisce l'id per poterla annullare, o `null` se non è stato possibile.
 */
export async function scheduleRestEnd(
  seconds: number,
  label: string | null,
  sound: boolean,
): Promise<string | null> {
  if (seconds <= 0) return null;

  const module = load();
  if (!module) return null;

  try {
    if (!(await requestNotificationPermission())) return null;
    await ensureChannel(module);

    return await module.scheduleNotificationAsync({
      content: {
        title: 'Recupero finito',
        body: label ? `Torna sotto: ${label}` : 'Torna sotto.',
        sound,
        vibrate: [0, 250, 150, 250],
      },
      trigger: {
        type: module.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        channelId: REST_NOTIFICATION_CHANNEL,
      },
    });
  } catch {
    return null;
  }
}

export function cancelScheduled(notificationId: string | null): void {
  if (!notificationId) return;
  const module = load();
  if (!module) return;
  module.cancelScheduledNotificationAsync(notificationId).catch(() => {});
}
