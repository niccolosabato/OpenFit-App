/**
 * Riordino di liste e conseguenze sui superset.
 *
 * Sta qui e non nelle query perche' e' logica pura: un errore di indice si
 * vede solo quando la scheda torna in ordine sbagliato dopo un trascinamento,
 * e a quel punto e' difficile capire se ha sbagliato il gesto o il database.
 */

/** Sposta un elemento da una posizione a un'altra, restituendo il nuovo ordine. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to) return items.slice();
  if (from < 0 || from >= items.length) return items.slice();

  const next = items.slice();
  const [moved] = next.splice(from, 1);
  // `to` puo' arrivare da un calcolo su posizioni schermo: si stringe nel
  // range valido invece di lasciar sparire l'elemento in fondo all'array.
  next.splice(Math.min(Math.max(to, 0), next.length), 0, moved);
  return next;
}

/**
 * Quali esercizi devono perdere il gruppo superset dopo un riordino.
 *
 * Un superset e' un fatto di contiguita': sono esercizi che si alternano, e
 * alternarsi vuol dire stare uno dopo l'altro. Chi resta solo, o chi viene
 * separato dai compagni, non e' piu' in superset e va sciolto.
 *
 * Se lo stesso gruppo finisce spezzato in due tronconi si tiene il primo: e'
 * quello che l'utente ha lasciato dov'era, l'altro e' quello che ha trascinato
 * via.
 */
export function supersetsToClear(
  ordered: { id: string; supersetGroup: number | null }[],
): string[] {
  const clear: string[] = [];
  const seen = new Set<number>();

  let start = 0;
  while (start < ordered.length) {
    const group = ordered[start].supersetGroup;
    if (group === null) {
      start += 1;
      continue;
    }

    let end = start + 1;
    while (end < ordered.length && ordered[end].supersetGroup === group) end += 1;

    const run = ordered.slice(start, end);
    if (run.length < 2 || seen.has(group)) {
      for (const item of run) clear.push(item.id);
    } else {
      seen.add(group);
    }

    start = end;
  }

  return clear;
}
