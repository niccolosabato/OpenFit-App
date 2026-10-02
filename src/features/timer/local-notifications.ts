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
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

/**
 * L'id è cambiato quando il suono è passato dallo stream delle notifiche a
 * quello delle sveglie: Android cristallizza le impostazioni di un canale alla
 * sua creazione, e riusare `rest-timer` avrebbe lasciato il vecchio suono su
 * ogni telefono dove il canale esisteva già. Un id nuovo è l'unico modo di
 * cambiare davvero.
 */
export const REST_NOTIFICATION_CHANNEL = 'rest-timer-v2';

/**
 * Il gemello silenzioso.
 *
 * Su Android 8+ il suono lo decide il canale, non il contenuto: spegnere il
 * suono dalle impostazioni non poteva funzionare finché era sempre lo stesso
 * canale a suonare. Sono due canali diversi perché il silenzio non è una
 * proprietà modificabile a runtime.
 */
const REST_NOTIFICATION_CHANNEL_SILENT = 'rest-timer-v2-silent';

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
    // Anche la configurazione del gestore sta dentro il `try`: un modulo
    // presente ma con un'API inattesa (versione diversa, build senza il
    // modulo giusto) lancerebbe qui, e questo `load()` viene chiamato
    // all'apertura dell'app da `dismissPresented` — un errore qui sarebbe un
    // crash all'avvio, non un timer senza suono.
    try {
      // Come si comporta una notifica che arriva ad app aperta: il suono sì —
      // è il segnale che il recupero è finito — ma niente banner, perché la
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
      handlerConfigured = true;
    } catch {
      cached = null;
      return null;
    }
  }

  return cached;
}

/** Su Android una notifica deve appartenere a un canale per poter suonare. */
async function ensureChannel(module: NotificationsModule, sound: boolean): Promise<void> {
  if (Platform.OS !== 'android') return;
  await module.setNotificationChannelAsync(sound ? REST_NOTIFICATION_CHANNEL : REST_NOTIFICATION_CHANNEL_SILENT, {
    name: sound ? 'Timer di recupero' : 'Timer di recupero (silenzioso)',
    // `MAX` e non `HIGH`: è l'unico livello che fa comparire l'avviso in testa
    // allo schermo a schermo bloccato, che è esattamente dove serve quando il
    // telefono è appoggiato sulla panca.
    importance: module.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 150, 250],
    sound: sound ? 'default' : null,
    // Il fine recupero deve sentirsi anche col volume dei media a zero, che in
    // palestra è quasi sempre il caso: instradandolo sullo stream delle
    // sveglie (`ALARM`) il suono non dipende più dalla musica ma dal volume
    // degli allarmi, che di solito è alto e resta alto anche a schermo bloccato.
    audioAttributes: {
      usage: module.AndroidAudioUsage.ALARM,
      contentType: module.AndroidAudioContentType.SONIFICATION,
      flags: {
        enforceAudibility: true,
        requestHardwareAudioVideoSynchronization: false,
      },
    },
    bypassDnd: false,
    enableVibrate: true,
    showBadge: false,
    lockscreenVisibility: module.AndroidNotificationVisibility.PUBLIC,
  });
}

/** Il canale su cui far comparire la notifica, in base al suono richiesto. */
function channelFor(sound: boolean): string {
  return sound ? REST_NOTIFICATION_CHANNEL : REST_NOTIFICATION_CHANNEL_SILENT;
}

/**
 * Chiede il permesso alle notifiche.
 *
 * Si chiama quando parte la sessione e non all'avvio dell'app: il permesso ha
 * senso solo quando si capisce a cosa serve, e la sessione è il momento in cui
 * lo si capisce. Farlo qui e non alla prima serie toglie il dialogo di sistema
 * dal percorso critico del timer.
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
 * Prepara canale e permesso prima che servano davvero.
 *
 * La prima schedulazione di una sessione arrivava dopo un dialogo di sistema
 * ancora aperto, e quella serie poteva restare senza notifica. Qui si paga il
 * costo una volta sola, all'apertura della sessione: quando il recupero parte
 * è già tutto pronto.
 */
export async function prepareRestNotifications(sound: boolean): Promise<void> {
  const module = load();
  if (!module) return;

  try {
    await requestNotificationPermission();
    await ensureChannel(module, sound);
  } catch {
    // Senza notifiche il timer resta comunque valido in primo piano.
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
    await ensureChannel(module, sound);

    return await module.scheduleNotificationAsync({
      content: {
        title: 'Recupero finito',
        body: label ? `Torna sotto: ${label}` : 'Torna sotto.',
        sound,
        vibrate: [0, 250, 150, 250],
        priority: 'max',
      },
      trigger: {
        type: module.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        channelId: channelFor(sound),
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

/**
 * Da che versione di Android il permesso degli allarmi esatti non è più
 * concesso in partenza.
 *
 * Fino ad Android 13 basta dichiararlo nel manifest (`SCHEDULE_EXACT_ALARM`) e
 * il sistema lo concede; da Android 14 va attivato a mano in "Sveglie e
 * promemoria". Non c'è modo di leggere lo stato con i moduli disponibili,
 * quindi la guida si mostra solo a partire da qui.
 */
export const NEEDS_EXACT_ALARM_PERMISSION =
  Platform.OS === 'android' && Number(Platform.Version) >= 34;

/**
 * Apre la schermata di sistema "Sveglie e promemoria" per questa app.
 *
 * Senza il permesso, `expo-notifications` ripiega su un allarme inesatto che in
 * Doze può ritardare o saltare il fine recupero — ed è il sospetto numero uno
 * dietro le notifiche che ogni tanto non arrivano.
 */
export function openExactAlarmSettings(): void {
  try {
    const pkg = Constants.expoConfig?.android?.package;
    IntentLauncher.startActivityAsync('android.settings.REQUEST_SCHEDULE_EXACT_ALARM', {
      data: pkg ? `package:${pkg}` : undefined,
    }).catch(() => {});
  } catch {
    // In Expo Go o dove l'intent non esiste non c'è niente da aprire.
  }
}

/**
 * Toglie dalla tendina le notifiche già mostrate.
 *
 * Serve all'apertura dell'app: il recupero può essere finito mentre il
 * telefono era in tasca, e chi ha appena aperto l'app quel recupero l'ha già
 * letto. Annulla solo quelle *presentate*, non quelle programmate — un timer
 * ancora in corso non si tocca.
 */
export function dismissPresented(): void {
  const module = load();
  if (!module) return;
  module.dismissAllNotificationsAsync().catch(() => {});
}
