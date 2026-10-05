import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./local-notifications', () => ({
  cancelScheduled: vi.fn(),
  scheduleRestEnd: vi.fn(),
  NEEDS_EXACT_ALARM_PERMISSION: false,
  NOTIFICATIONS_AVAILABLE: false,
  dismissPresented: vi.fn(),
  openExactAlarmSettings: vi.fn(),
  prepareRestNotifications: vi.fn(),
  requestNotificationPermission: vi.fn(),
}));

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

import { cancelScheduled, scheduleRestEnd } from './local-notifications';
import { useRestTimer } from './rest-timer';

const scheduleMock = vi.mocked(scheduleRestEnd);
const cancelMock = vi.mocked(cancelScheduled);

const idle = { endsAt: null, pausedRemaining: null, duration: 0, label: null, kind: 'rest' as const, notificationId: null };

function startRest() {
  useRestTimer.getState().start(60, 'Panca piana', { sound: true, notify: true });
}

describe('useRestTimer', () => {
  beforeEach(() => {
    useRestTimer.setState(idle);
    scheduleMock.mockReset();
    cancelMock.mockReset();
  });

  it('un recupero riavviato annulla la notifica precedente', async () => {
    scheduleMock.mockResolvedValueOnce('a');
    startRest();
    await vi.waitFor(() => expect(useRestTimer.getState().notificationId).toBe('a'));

    scheduleMock.mockResolvedValueOnce('b');
    startRest();
    await vi.waitFor(() => expect(useRestTimer.getState().notificationId).toBe('b'));

    expect(cancelMock).toHaveBeenCalledWith('a');
    expect(cancelMock).not.toHaveBeenCalledWith('b');
  });

  it('più avvii ravvicinati lasciano una sola notifica armata', async () => {
    scheduleMock.mockResolvedValueOnce('a').mockResolvedValueOnce('b').mockResolvedValueOnce('c');

    startRest();
    startRest();
    startRest();

    await vi.waitFor(() => expect(useRestTimer.getState().notificationId).toBe('c'));

    expect(cancelMock).toHaveBeenCalledWith('a');
    expect(cancelMock).toHaveBeenCalledWith('b');
    expect(cancelMock).not.toHaveBeenCalledWith('c');
  });
});
