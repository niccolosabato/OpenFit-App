import { isSameDay } from 'date-fns';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Un istante di oggi, che cambia solo quando cambia il giorno.
 *
 * Le schermate che ragionano per "oggi", "questa settimana" o "le ultime N
 * settimane" non possono chiamare `Date.now()` o `new Date()` nel render: il
 * compilatore React tratta il risultato come un valore qualsiasi e decide lui
 * quando ricalcolarlo. Nelle Statistiche questo rendeva la finestra della query
 * diversa a ogni render, e la query ripartiva all'infinito; nella schermata Oggi
 * l'inizio della settimana veniva calcolato una volta sola e restava fermo.
 *
 * Qui l'istante sta nello stato e si rilegge quando l'app torna in primo piano
 * o la schermata riprende il fuoco. Si aggiorna solo se nel frattempo è
 * cambiato il giorno: a tutte queste schermate interessa la data, e un valore
 * stabile nella giornata evita render e query che non cambierebbero niente.
 */
export function useToday(): number {
  const [today, setToday] = useState(() => Date.now());

  const refresh = useCallback(() => {
    const current = Date.now();
    setToday((previous) => (isSameDay(previous, current) ? previous : current));
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  useFocusEffect(refresh);

  return today;
}
