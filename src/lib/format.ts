/** Formattazione di tempi e date. Tutto in italiano, tutto locale. */

import { format, formatDistanceToNowStrict, isThisYear, isToday, isYesterday } from 'date-fns';
import { it } from 'date-fns/locale';

/** `90` → `1:30`; `45` → `0:45`; `3725` → `1:02:05`. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Durata discorsiva per liste e riepiloghi: `1h 12min`, `48min`, `30s`. */
export function formatDurationLong(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) return `${s}s`;

  // Si arrotonda ai minuti *prima* di separare ore e minuti, altrimenti 59'59"
  // diventerebbe "60min" invece di "1h".
  const totalMinutes = Math.round(s / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}min`;
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}

/** Recupero come lo si scrive in una scheda: `90"`, `2'`, `2'30"`. */
export function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds}"`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes}'` : `${minutes}'${String(rest).padStart(2, '0')}"`;
}

/** `Oggi`, `Ieri`, `lun 3 mar`, `3 mar 2025`. */
export function formatSessionDate(date: Date): string {
  if (isToday(date)) return 'Oggi';
  if (isYesterday(date)) return 'Ieri';
  if (isThisYear(date)) return format(date, 'EEE d MMM', { locale: it });
  return format(date, 'd MMM yyyy', { locale: it });
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm', { locale: it });
}

export function formatDayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** `3 giorni fa` — per l'ultima volta che si è fatto un esercizio. */
export function formatRelative(date: Date): string {
  return `${formatDistanceToNowStrict(date, { locale: it })} fa`;
}

/** `12 serie` / `1 serie`. */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
