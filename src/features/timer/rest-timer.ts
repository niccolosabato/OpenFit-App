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
 *    Se l'utente torna prima, la notifica viene annullata. Dove le notifiche
 *    non esistono (Expo Go su Android) il timer resta valido in primo piano —
 *    vedi `local-notifications.ts`.
 */

import * as Haptics from 'expo-haptics';
import { create } from 'zustand';

import { cancelScheduled, scheduleRestEnd } from './local-notifications';

export {
  NEEDS_EXACT_ALARM_PERMISSION,
  NOTIFICATIONS_AVAILABLE,
  dismissPresented,
  openExactAlarmSettings,
  prepareRestNotifications,
  requestNotificationPermission,
} from './local-notifications';

/** Di quanto aggiustano i tasti +/− sul countdown. */
export const REST_ADJUST_STEP = 15;

type RestTimerState = {
  /** Istante di fine in epoch ms; `null` se non c'è nessun recupero in corso
   *  o se è in pausa — in pausa il tempo non scorre, un istante di fine non
   *  vorrebbe dire niente. */
  endsAt: number | null;
  /** Secondi rimasti al momento della pausa; `null` quando non è in pausa. */
  pausedRemaining: number | null;
  /** Durata impostata all'avvio, per disegnare la barra di avanzamento. */
  duration: number;
  /** Nome dell'esercizio da cui si sta recuperando. */
  label: string | null;
  /** Recupero fra le serie oppure timer libero: cambia solo l'intestazione. */
  kind: TimerKind;
  /** Notifica schedulata, da annullare se il recupero finisce prima. */
  notificationId: string | null;

  start: (seconds: number, label: string | null, options: TimerOptions) => void;
  adjust: (deltaSeconds: number, options: TimerOptions) => void;
  /** Congela il countdown e annulla la notifica: si riprende da dove si era. */
  pause: () => void;
  /** Riparte dal residuo congelato in pausa, e rischedula la notifica. */
  resume: (options: TimerOptions) => void;
  stop: () => void;
};

/** Recupero fra le serie o timer libero: stessa macchina, intestazione diversa. */
export type TimerKind = 'rest' | 'timer';

export type TimerOptions = {
  sound: boolean;
  notify: boolean;
  /** Assente = recupero. Il timer libero lo imposta a `'timer'`. */
  kind?: TimerKind;
};

function cancel(notificationId: string | null): void {
  cancelScheduled(notificationId);
}

/**
 * Numero d'ordine dell'ultima schedulazione richiesta.
 *
 * `scheduleRestEnd` è asincrono e passa da un eventuale dialogo di sistema: fra
 * la richiesta e l'id che torna indietro il timer può essere stato aggiustato,
 * messo in pausa o saltato. Senza un contatore, una schedulazione vecchia che
 * rientra per ultima scriverebbe il suo id al posto di quello giusto, lasciando
 * in giro una notifica che suonerà al momento sbagliato — o nascondendo quella
 * buona. Incrementandolo a ogni rilascio, i rientri fuori tempo si annullano da
 * soli.
 */
let scheduleSeq = 0;

export const useRestTimer = create<RestTimerState>((set, get) => {
  /** Annulla la notifica corrente (o quella in arrivo) e invalida i rientri. */
  function release(): void {
    cancel(get().notificationId);
    scheduleSeq += 1;
    set({ notificationId: null });
  }

  /**
   * Programma la notifica di fine recupero, tenendo solo l'ultima richiesta.
   *
   * Cancella sempre quella precedente prima di chiedere, così due tocchi ravvicinati
   * non lasciano in piedi due allarmi per lo stesso recupero.
   */
  function schedule(seconds: number, label: string | null, options: TimerOptions): void {
    cancel(get().notificationId);
    scheduleSeq += 1;
    const seq = scheduleSeq;

    if (!options.notify) {
      set({ notificationId: null });
      return;
    }

    scheduleRestEnd(seconds, label, options.sound).then((id) => {
      // Non è più la richiesta corrente, o il recupero è stato chiuso nel
      // frattempo: questa notifica va cancellata, non registrata.
      if (seq !== scheduleSeq || get().endsAt === null) cancel(id);
      else set({ notificationId: id });
    });
  }

  return {
    endsAt: null,
    pausedRemaining: null,
    duration: 0,
    label: null,
    kind: 'rest',
    notificationId: null,

    start: (seconds, label, options) => {
      if (seconds <= 0) {
        release();
        set({ endsAt: null, pausedRemaining: null, duration: 0, label: null });
        return;
      }

      set({
        endsAt: Date.now() + seconds * 1000,
        pausedRemaining: null,
        duration: seconds,
        label,
        kind: options.kind ?? 'rest',
        notificationId: null,
      });

      schedule(seconds, label, options);
    },

    adjust: (deltaSeconds, options) => {
      const { endsAt, pausedRemaining, duration, label } = get();
      if (endsAt === null && pausedRemaining === null) return;

      // In pausa si aggiusta il residuo congelato: il conto riparte solo alla
      // ripresa, con la sua notifica.
      if (pausedRemaining !== null) {
        release();

        const nextRemaining = pausedRemaining + deltaSeconds;

        if (nextRemaining <= 0) {
          set({ endsAt: null, pausedRemaining: null, duration: 0, label: null });
          return;
        }

        set({
          pausedRemaining: nextRemaining,
          duration: Math.max(duration + deltaSeconds, nextRemaining),
        });
        return;
      }

      const nextEndsAt = endsAt! + deltaSeconds * 1000;
      const remaining = Math.round((nextEndsAt - Date.now()) / 1000);

      if (remaining <= 0) {
        release();
        set({ endsAt: null, pausedRemaining: null, duration: 0, label: null });
        return;
      }

      set({
        endsAt: nextEndsAt,
        duration: Math.max(duration + deltaSeconds, remaining),
      });

      schedule(remaining, label, options);
    },

    pause: () => {
      const { endsAt } = get();
      if (endsAt === null) return; // già fermo o già in pausa

      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      release();
      set({ endsAt: null, pausedRemaining: remaining });
    },

    resume: (options) => {
      const { pausedRemaining, label } = get();
      if (pausedRemaining === null) return;

      set({ endsAt: Date.now() + pausedRemaining * 1000, pausedRemaining: null });
      schedule(pausedRemaining, label, options);
    },

    stop: () => {
      release();
      set({ endsAt: null, pausedRemaining: null, duration: 0, label: null });
    },
  };
});

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
