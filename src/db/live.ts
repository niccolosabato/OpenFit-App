/**
 * `useLiveQuery`, ma con la prima lettura già fatta.
 *
 * `useLiveQuery` di Drizzle risolve la prima lettura dentro una promessa: fino
 * a quando non arriva restituisce una lista vuota. Su una schermata che si
 * apre con un'animazione — la sessione entra dal basso e ci mette trecento
 * millisecondi — quella lista vuota non dura un fotogramma ma tutta l'entrata,
 * e per tutta l'entrata si legge "Nessun allenamento in corso" o "Allenamento
 * vuoto" prima che compaia il contenuto vero.
 *
 * Il driver di expo-sqlite però è **sincrono**: la prima risposta la si può
 * avere subito, nel corpo del componente, senza aspettare niente. La query
 * viva continua a servire per tutto il resto, cioè tenere la schermata
 * aggiornata quando i dati cambiano.
 *
 * Da usare dove il «non c'è niente» ha una resa diversa dal «c'è qualcosa»:
 * per una lista che si limita a essere vuota non cambia nulla.
 */

import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRef } from 'react';

import type { AnySQLiteSelect } from 'drizzle-orm/sqlite-core';

type LiveSelect = Pick<AnySQLiteSelect, '_' | 'then'>;

export function useLiveRows<T extends LiveSelect>(query: T, deps: unknown[] = []): Awaited<T> {
  const { data, updatedAt } = useLiveQuery(query, deps);

  /**
   * La lettura sincrona, e il valore di `updatedAt` visto nel momento in cui
   * è stata fatta.
   *
   * Il secondo serve perché `useLiveQuery` **non azzera `updatedAt` quando
   * cambiano le dipendenze**: dopo un cambio di dipendenze resterebbe segnato
   * come «già letto» mentre i dati che restituisce sono ancora quelli di
   * prima. Confrontando con l'istantanea si sa se la risposta viva è arrivata
   * *dopo* la lettura sincrona, e quindi se l'ha superata in freschezza.
   */
  const primed = useRef<{ key: string; rows: Awaited<T>; at: Date | undefined } | null>(null);

  const key = deps.map(String).join(' ');
  if (primed.current === null || primed.current.key !== key) {
    primed.current = { key, rows: readNow(query), at: updatedAt };
  }

  const live = updatedAt !== undefined && updatedAt !== primed.current.at;
  return live ? data : primed.current.rows;
}

/**
 * La query, eseguita subito.
 *
 * Se fallisce non si alza: l'errore lo riporta comunque la query viva, e far
 * cadere una schermata durante il suo primo render sarebbe un modo peggiore di
 * dirlo. Nel frattempo si mostra quel che si mostrerebbe senza dati.
 */
function readNow<T extends LiveSelect>(query: T): Awaited<T> {
  try {
    // `all()` c'è su ogni select del driver di expo-sqlite, che è sincrono, ma
    // non compare nel tipo ridotto che `useLiveQuery` accetta.
    return (query as unknown as { all: () => Awaited<T> }).all();
  } catch {
    return [] as unknown as Awaited<T>;
  }
}
