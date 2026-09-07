/**
 * Schede pronte.
 *
 * Servono a non partire dal foglio bianco: si sceglie una struttura nota, si
 * fa partire il primo allenamento e la si aggiusta strada facendo. Gli esercizi
 * sono riferiti per slug del seed (vedi `seed/exercises.ts`); se uno slug non
 * esiste più viene semplicemente saltato, così la scheda si crea lo stesso.
 */

import { eq } from 'drizzle-orm';

import { newId } from '@/lib/ids';
import { db } from '../client';
import type { SetType } from '../enums';
import { exercises, routineDays, routineExercises, routineSets, routines } from '../schema';

type TemplateSet = {
  type?: SetType;
  reps?: [number, number];
  rpe?: number;
  seconds?: number;
};

type TemplateExercise = {
  /** Slug dell'esercizio nel seed. */
  ref: string;
  sets: TemplateSet[];
  rest?: number;
  /** Esercizi con la stessa lettera vanno in superset. */
  superset?: string;
  notes?: string;
};

type TemplateDay = { name: string; exercises: TemplateExercise[] };

export type RoutineTemplate = {
  id: string;
  name: string;
  description: string;
  /** Sessioni a settimana per cui è pensata. */
  frequency: string;
  days: TemplateDay[];
};

const straight = (count: number, reps: [number, number], rpe?: number): TemplateSet[] =>
  Array.from({ length: count }, () => ({ reps, rpe }));

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    description:
      'Spinta, trazione e gambe su tre giorni. Il classico: si ripete due volte a settimana quando si vuole alzare la frequenza.',
    frequency: '3-6 giorni',
    days: [
      {
        name: 'A — Spinta',
        exercises: [
          { ref: 'panca-piana-bilanciere', sets: straight(4, [6, 8], 8), rest: 150 },
          { ref: 'lento-avanti-manubri', sets: straight(3, [8, 10], 8), rest: 120 },
          { ref: 'panca-inclinata-manubri', sets: straight(3, [10, 12]), rest: 105 },
          { ref: 'alzate-laterali-manubri', sets: straight(4, [12, 15]), rest: 60 },
          { ref: 'push-down-corda', sets: straight(3, [10, 12]), rest: 60 },
          { ref: 'estensioni-sopra-la-testa-cavi', sets: straight(3, [12, 15]), rest: 60 },
        ],
      },
      {
        name: 'B — Trazione',
        exercises: [
          { ref: 'trazioni-prona', sets: straight(4, [6, 10], 8), rest: 150 },
          { ref: 'rematore-bilanciere', sets: straight(4, [8, 10], 8), rest: 150 },
          { ref: 'pulley-basso', sets: straight(3, [10, 12]), rest: 105 },
          { ref: 'face-pull', sets: straight(3, [15, 20]), rest: 60 },
          { ref: 'curl-bilanciere', sets: straight(3, [8, 12]), rest: 75 },
          { ref: 'curl-martello', sets: straight(3, [10, 12]), rest: 60 },
        ],
      },
      {
        name: 'C — Gambe',
        exercises: [
          { ref: 'squat-bilanciere', sets: straight(4, [5, 8], 8), rest: 210 },
          { ref: 'stacco-rumeno', sets: straight(3, [8, 10], 8), rest: 150 },
          { ref: 'pressa-45', sets: straight(3, [10, 12]), rest: 150 },
          { ref: 'leg-curl-sdraiato', sets: straight(3, [10, 12]), rest: 75 },
          { ref: 'calf-in-piedi', sets: straight(4, [12, 15]), rest: 60 },
          { ref: 'plank', sets: [{ type: 'iso_hold', seconds: 45 }, { type: 'iso_hold', seconds: 45 }, { type: 'iso_hold', seconds: 45 }], rest: 60 },
        ],
      },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    description:
      'Parte alta e parte bassa alternate, quattro volte a settimana. Buon compromesso fra frequenza e recupero.',
    frequency: '4 giorni',
    days: [
      {
        name: 'Upper A — forza',
        exercises: [
          { ref: 'panca-piana-bilanciere', sets: straight(4, [5, 6], 8), rest: 180 },
          { ref: 'rematore-bilanciere', sets: straight(4, [6, 8], 8), rest: 150 },
          { ref: 'lento-avanti-bilanciere', sets: straight(3, [6, 8], 8), rest: 150 },
          { ref: 'lat-machine-avanti', sets: straight(3, [8, 10]), rest: 105 },
          { ref: 'curl-ez', sets: straight(3, [8, 10]), rest: 75, superset: 'A' },
          { ref: 'push-down-barra', sets: straight(3, [8, 10]), rest: 90, superset: 'A' },
        ],
      },
      {
        name: 'Lower A — forza',
        exercises: [
          { ref: 'squat-bilanciere', sets: straight(4, [5, 6], 8), rest: 210 },
          { ref: 'stacco-rumeno', sets: straight(3, [8, 10], 8), rest: 150 },
          { ref: 'affondi-bulgari', sets: straight(3, [10, 12]), rest: 120 },
          { ref: 'leg-curl-seduto', sets: straight(3, [10, 12]), rest: 75 },
          { ref: 'calf-seduto', sets: straight(4, [12, 15]), rest: 60 },
        ],
      },
      {
        name: 'Upper B — ipertrofia',
        exercises: [
          { ref: 'panca-inclinata-manubri', sets: straight(4, [8, 12]), rest: 120 },
          { ref: 'pulley-basso', sets: straight(4, [10, 12]), rest: 105 },
          { ref: 'chest-press', sets: straight(3, [12, 15]), rest: 90 },
          { ref: 'trazioni-supina', sets: straight(3, [8, 12]), rest: 120 },
          { ref: 'alzate-laterali-cavi', sets: straight(4, [12, 20]), rest: 60 },
          { ref: 'french-press-ez', sets: straight(3, [10, 12]), rest: 75 },
        ],
      },
      {
        name: 'Lower B — ipertrofia',
        exercises: [
          { ref: 'hack-squat', sets: straight(4, [10, 12]), rest: 150 },
          { ref: 'hip-thrust', sets: straight(3, [10, 12]), rest: 150 },
          { ref: 'leg-extension', sets: straight(3, [12, 15]), rest: 75 },
          { ref: 'leg-curl-sdraiato', sets: straight(3, [12, 15]), rest: 75 },
          { ref: 'calf-in-piedi', sets: straight(4, [15, 20]), rest: 60 },
        ],
      },
    ],
  },
  {
    id: 'full-body',
    name: 'Full body 3×',
    description:
      'Tre sedute a corpo intero. La scelta giusta per iniziare o per riprendere dopo una pausa lunga.',
    frequency: '3 giorni',
    days: [
      {
        name: 'A',
        exercises: [
          { ref: 'squat-bilanciere', sets: straight(3, [8, 10]), rest: 180 },
          { ref: 'panca-piana-bilanciere', sets: straight(3, [8, 10]), rest: 150 },
          { ref: 'pulley-basso', sets: straight(3, [10, 12]), rest: 105 },
          { ref: 'lento-avanti-manubri', sets: straight(2, [10, 12]), rest: 105 },
          { ref: 'plank', sets: [{ type: 'iso_hold', seconds: 40 }, { type: 'iso_hold', seconds: 40 }], rest: 60 },
        ],
      },
      {
        name: 'B',
        exercises: [
          { ref: 'stacco-rumeno', sets: straight(3, [8, 10]), rest: 180 },
          { ref: 'lat-machine-avanti', sets: straight(3, [10, 12]), rest: 105 },
          { ref: 'panca-inclinata-manubri', sets: straight(3, [10, 12]), rest: 120 },
          { ref: 'affondi-manubri', sets: straight(2, [10, 12]), rest: 120 },
          { ref: 'crunch-cavi', sets: straight(3, [12, 15]), rest: 60 },
        ],
      },
      {
        name: 'C',
        exercises: [
          { ref: 'pressa-45', sets: straight(3, [10, 12]), rest: 150 },
          { ref: 'rematore-manubrio', sets: straight(3, [10, 12]), rest: 105 },
          { ref: 'chest-press', sets: straight(3, [10, 12]), rest: 105 },
          { ref: 'alzate-laterali-manubri', sets: straight(3, [12, 15]), rest: 60 },
          { ref: 'leg-curl-sdraiato', sets: straight(3, [12, 15]), rest: 75 },
        ],
      },
    ],
  },
];

/**
 * Materializza un template in una scheda vera.
 *
 * Da qui in poi la scheda è dell'utente e non ha più legami con il template:
 * modificarla non tocca nient'altro.
 */
export function createRoutineFromTemplate(template: RoutineTemplate): string {
  const routineId = newId();

  db.transaction((tx) => {
    tx.insert(routines).values({ id: routineId, name: template.name, notes: template.description }).run();

    template.days.forEach((day, dayIndex) => {
      const dayId = newId();
      tx.insert(routineDays).values({ id: dayId, routineId, name: day.name, orderIndex: dayIndex }).run();

      // Le lettere di superset del template vanno tradotte in un numero
      // condiviso dagli esercizi dello stesso gruppo.
      const supersetGroups = new Map<string, number>();

      day.exercises.forEach((item, exerciseIndex) => {
        const exists = tx.select({ id: exercises.id }).from(exercises).where(eq(exercises.id, item.ref)).get();
        if (!exists) return; // slug non più nel seed: si salta invece di rompere la scheda

        if (item.superset && !supersetGroups.has(item.superset)) {
          supersetGroups.set(item.superset, exerciseIndex);
        }

        const routineExerciseId = newId();
        tx.insert(routineExercises)
          .values({
            id: routineExerciseId,
            dayId,
            exerciseId: item.ref,
            orderIndex: exerciseIndex,
            restSeconds: item.rest ?? null,
            supersetGroup: item.superset ? (supersetGroups.get(item.superset) ?? null) : null,
            notes: item.notes ?? null,
          })
          .run();

        tx.insert(routineSets)
          .values(
            item.sets.map((set, setIndex) => ({
              id: newId(),
              routineExerciseId,
              orderIndex: setIndex,
              setType: set.type ?? ('working' as const),
              targetRepsMin: set.reps?.[0] ?? null,
              targetRepsMax: set.reps?.[1] ?? null,
              targetRpe: set.rpe ?? null,
              targetDurationSeconds: set.seconds ?? null,
            })),
          )
          .run();
      });
    });
  });

  return routineId;
}
