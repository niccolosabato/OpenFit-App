import { describe, expect, it } from 'vitest';

import { moveItem, supersetsToClear } from './reorder';

describe('moveItem', () => {
  it('sposta un elemento in avanti', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('sposta un elemento indietro', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('non tocca niente se la posizione non cambia', () => {
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });

  it('restituisce una copia, non la lista originale', () => {
    const items = ['a', 'b'];
    expect(moveItem(items, 0, 0)).not.toBe(items);
  });

  it('stringe le destinazioni fuori range invece di perdere l’elemento', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 99)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b', 'c'], 2, -5)).toEqual(['c', 'a', 'b']);
  });

  it('ignora un indice di partenza inesistente', () => {
    expect(moveItem(['a', 'b'], 7, 0)).toEqual(['a', 'b']);
  });
});

describe('supersetsToClear', () => {
  const item = (id: string, supersetGroup: number | null = null) => ({ id, supersetGroup });

  it('lascia stare un superset rimasto contiguo', () => {
    expect(
      supersetsToClear([item('a'), item('b', 1), item('c', 1), item('d')]),
    ).toEqual([]);
  });

  it('scioglie il gruppo quando qualcosa si infila in mezzo', () => {
    expect(
      supersetsToClear([item('a', 1), item('b'), item('c', 1)]),
    ).toEqual(['a', 'c']);
  });

  it('scioglie il gruppo rimasto con un solo membro', () => {
    expect(supersetsToClear([item('a', 1), item('b'), item('c')])).toEqual(['a']);
  });

  it('tiene distinti due superset diversi nello stesso giorno', () => {
    expect(
      supersetsToClear([item('a', 1), item('b', 1), item('c', 2), item('d', 2)]),
    ).toEqual([]);
  });

  it('davanti a un gruppo spezzato in due tronconi tiene il primo', () => {
    expect(
      supersetsToClear([
        item('a', 1),
        item('b', 1),
        item('c'),
        item('d', 1),
        item('e', 1),
      ]),
    ).toEqual(['d', 'e']);
  });

  it('non ha niente da sciogliere in una lista senza superset', () => {
    expect(supersetsToClear([item('a'), item('b'), item('c')])).toEqual([]);
    expect(supersetsToClear([])).toEqual([]);
  });
});
