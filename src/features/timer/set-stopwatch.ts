/**
 * Cronometro di una serie a tempo: plank, hollow hold, farmer's walk.
 *
 * Stessa scelta del recupero: lo stato è l'istante di partenza, non un
 * contatore. Così il tempo resta giusto anche se il telefono sospende l'app
 * mentre si è nella posizione — che è esattamente quando non lo si può toccare.
 *
 * Ce n'è uno solo per volta: due cronometri aperti insieme non avrebbero senso
 * in una seduta, e la serie che si sta tenendo è una.
 */

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';

type SetStopwatchState = {
  /** Id della serie che si sta cronometrando; `null` se nessuna. */
  setKey: string | null;
  /** Istante di partenza in epoch ms. */
  startedAt: number | null;
  start: (setKey: string) => void;
  /** Ferma e restituisce la serie cronometrata con i secondi trascorsi. */
  stop: () => { setKey: string; seconds: number } | null;
  reset: () => void;
};

export const useSetStopwatchStore = create<SetStopwatchState>((set, get) => ({
  setKey: null,
  startedAt: null,

  start: (setKey) => set({ setKey, startedAt: Date.now() }),

  stop: () => {
    const { setKey, startedAt } = get();
    if (setKey === null || startedAt === null) return null;

    // Almeno un secondo: una tenuta cronometrata dura per definizione qualcosa.
    const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    set({ setKey: null, startedAt: null });
    return { setKey, seconds };
  },

  reset: () => set({ setKey: null, startedAt: null }),
}));

/**
 * Secondi trascorsi per la serie data, ricalcolati dalla partenza.
 *
 * Il conto è calcolato dentro l'effetto e tenuto in stato, non ricavato da
 * `Date.now()` durante il render: il compilatore React, con un valore senza
 * dipendenze reattive, se lo memorizza e il numero resta fermo a zero finché
 * qualcos'altro non muove il componente. Il tick resta solo la causa del
 * ridisegno — il valore vero è sempre `now - startedAt`.
 */
export function useSetStopwatch(setId: string): { running: boolean; elapsed: number } {
  const setKey = useSetStopwatchStore((s) => s.setKey);
  const startedAt = useSetStopwatchStore((s) => s.startedAt);
  const running = setKey === setId && startedAt !== null;

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running || startedAt === null) {
      setElapsed(0);
      return;
    }

    const compute = () =>
      setElapsed(Math.max(0, Math.round((Date.now() - startedAt) / 1000)));

    compute();
    const interval = setInterval(compute, 250);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') compute();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [running, startedAt]);

  return { running, elapsed };
}
