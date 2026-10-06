import { describe, expect, it } from 'vitest';

import { sessionNotificationContent, type NotificationTimer } from './session-notification';

const NOW = 1_700_000_000_000;

function timer(overrides: Partial<NotificationTimer> = {}): NotificationTimer {
  return {
    endsAt: null,
    pausedRemaining: null,
    label: null,
    kind: 'rest',
    ...overrides,
  };
}

describe('sessionNotificationContent', () => {
  it('senza sessione non c’è niente da mostrare', () => {
    expect(sessionNotificationContent(null, timer({ endsAt: NOW + 90_000 }), NOW)).toBeNull();
  });

  it('senza timer la notifica dice che l’allenamento è in corso', () => {
    expect(sessionNotificationContent('Spinta A', timer(), NOW)).toEqual({
      title: 'Allenamento in corso',
      body: 'Spinta A',
      timestamp: null,
    });
  });

  it('durante il recupero mostra l’esercizio e affida il countdown a timestamp', () => {
    expect(
      sessionNotificationContent(
        'Spinta A',
        timer({ endsAt: NOW + 90_000, label: 'Panca piana' }),
        NOW,
      ),
    ).toEqual({
      title: 'Recupero',
      body: 'Panca piana',
      timestamp: NOW + 90_000,
    });
  });

  it('il recupero senza etichetta ha comunque un testo', () => {
    expect(
      sessionNotificationContent('Spinta A', timer({ endsAt: NOW + 90_000 }), NOW),
    ).toEqual({
      title: 'Recupero',
      body: 'Recupero in corso',
      timestamp: NOW + 90_000,
    });
  });

  it('il timer libero ha la sua intestazione', () => {
    expect(
      sessionNotificationContent(
        'Spinta A',
        timer({ endsAt: NOW + 60_000, kind: 'timer' }),
        NOW,
      ),
    ).toEqual({
      title: 'Timer',
      body: 'Timer libero',
      timestamp: NOW + 60_000,
    });
  });

  it('in pausa il tempo è nel testo e non c’è countdown', () => {
    expect(
      sessionNotificationContent('Spinta A', timer({ pausedRemaining: 45 }), NOW),
    ).toEqual({
      title: 'Recupero in pausa',
      body: 'In pausa · 0:45',
      timestamp: null,
    });
  });

  it('un recupero scaduto non è più un countdown: si torna alla sessione', () => {
    expect(
      sessionNotificationContent(
        'Spinta A',
        timer({ endsAt: NOW - 1_000, label: 'Panca piana' }),
        NOW,
      ),
    ).toEqual({
      title: 'Allenamento in corso',
      body: 'Spinta A',
      timestamp: null,
    });
  });
});