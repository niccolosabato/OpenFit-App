/**
 * Schema SQLite di OpenFit.
 *
 * Tre blocchi:
 *  1. `exercises`      — la libreria, indipendente da tutto il resto
 *  2. `routines*`      — la scheda: cosa *hai in programma* di fare
 *  3. `workout*`       — la sessione: cosa *hai davvero* fatto
 *
 * Programmato ed eseguito restano tabelle separate di proposito: modificare
 * una scheda non deve riscrivere lo storico, e una sessione libera (senza
 * scheda) deve essere altrettanto di prima classe.
 */

import { sql } from 'drizzle-orm';
import { AnySQLiteColumn, index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import type {
  EffortScale,
  Equipment,
  Mechanic,
  Muscle,
  PrType,
  SessionStatus,
  SetType,
  Technique,
  TrackingType,
  WeightUnit,
} from './enums';
import type { AccentKey } from '@/theme/tokens';

/** Millisecondi epoch. Colonna riusata ovunque per i timestamp. */
const timestamp = (name: string) => integer(name, { mode: 'timestamp_ms' });

const bool = (name: string) => integer(name, { mode: 'boolean' });

/* ═══════════════════════════════════════════════════════════ 1. LIBRERIA ══ */

export const exercises = sqliteTable(
  'exercises',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    /**
     * Nomi alternativi per la ricerca, separati da `;`
     * (es. "lat machine;pulldown;trazioni alla macchina").
     */
    aliases: text('aliases'),

    primaryMuscle: text('primary_muscle').$type<Muscle>().notNull(),
    /** Muscoli secondari, contano a metà nelle statistiche per gruppo. */
    secondaryMuscles: text('secondary_muscles', { mode: 'json' })
      .$type<Muscle[]>()
      .notNull()
      .default(sql`'[]'`),

    equipment: text('equipment').$type<Equipment>().notNull(),
    mechanic: text('mechanic').$type<Mechanic>().notNull().default('isolation'),
    trackingType: text('tracking_type').$type<TrackingType>().notNull().default('weight_reps'),

    /** Un arto per volta: il volume va contato per lato. */
    isUnilateral: bool('is_unilateral').notNull().default(false),
    /** Creato dall'utente: non viene toccato dagli aggiornamenti del seed. */
    isCustom: bool('is_custom').notNull().default(false),
    isFavorite: bool('is_favorite').notNull().default(false),

    instructions: text('instructions'),
    /** Recupero suggerito in secondi; se nullo vale il default globale. */
    defaultRestSeconds: integer('default_rest_seconds'),

    createdAt: timestamp('created_at').notNull().default(sql`(unixepoch() * 1000)`),
    /** Nascosto dalla libreria ma conservato: lo storico deve restare leggibile. */
    archivedAt: timestamp('archived_at'),
  },
  (t) => [
    index('idx_exercises_primary_muscle').on(t.primaryMuscle),
    index('idx_exercises_equipment').on(t.equipment),
    index('idx_exercises_name').on(t.name),
  ],
);

/* ══════════════════════════════════════════════════════════════ 2. SCHEDE ══ */

export const routines = sqliteTable(
  'routines',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    notes: text('notes'),
    orderIndex: integer('order_index').notNull().default(0),
    createdAt: timestamp('created_at').notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: timestamp('updated_at').notNull().default(sql`(unixepoch() * 1000)`),
    archivedAt: timestamp('archived_at'),
  },
  (t) => [index('idx_routines_order').on(t.orderIndex)],
);

/** Un giorno della scheda: "A — Spinta", "B — Trazione". */
export const routineDays = sqliteTable(
  'routine_days',
  {
    id: text('id').primaryKey(),
    routineId: text('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    notes: text('notes'),
    orderIndex: integer('order_index').notNull().default(0),
  },
  (t) => [index('idx_routine_days_routine').on(t.routineId, t.orderIndex)],
);

/** Un esercizio pianificato dentro un giorno. */
export const routineExercises = sqliteTable(
  'routine_exercises',
  {
    id: text('id').primaryKey(),
    dayId: text('day_id')
      .notNull()
      .references(() => routineDays.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    orderIndex: integer('order_index').notNull().default(0),
    /**
     * Esercizi con lo stesso valore formano un superset (o giant set):
     * si alternano senza recupero e il timer parte solo a fine giro.
     * Nullo = esercizio a sé.
     */
    supersetGroup: integer('superset_group'),
    /** Recupero in secondi per questo esercizio; nullo = default. */
    restSeconds: integer('rest_seconds'),
    notes: text('notes'),
  },
  (t) => [index('idx_routine_exercises_day').on(t.dayId, t.orderIndex)],
);

/**
 * Una serie *pianificata*.
 *
 * Sta su una riga propria (invece di un semplice campo `sets: 4`) perché una
 * scheda seria non ha quattro serie uguali: "1 top set @RPE9 + 2 back-off
 * all'85%" è una cosa che si scrive di continuo.
 */
export const routineSets = sqliteTable(
  'routine_sets',
  {
    id: text('id').primaryKey(),
    routineExerciseId: text('routine_exercise_id')
      .notNull()
      .references(() => routineExercises.id, { onDelete: 'cascade' }),
    orderIndex: integer('order_index').notNull().default(0),

    setType: text('set_type').$type<SetType>().notNull().default('working'),
    /** Se valorizzata, la serie va portata avanti con questa tecnica. */
    technique: text('technique').$type<Technique>(),

    targetRepsMin: integer('target_reps_min'),
    targetRepsMax: integer('target_reps_max'),
    /** Carico previsto in kg; nullo = da decidere in sessione. */
    targetWeight: real('target_weight'),
    targetRpe: real('target_rpe'),
    targetRir: integer('target_rir'),
    targetDurationSeconds: integer('target_duration_seconds'),
    targetDistanceMeters: real('target_distance_meters'),

    /** Sovrascrive il recupero dell'esercizio solo per questa serie. */
    restSecondsOverride: integer('rest_seconds_override'),
    notes: text('notes'),
  },
  (t) => [index('idx_routine_sets_exercise').on(t.routineExerciseId, t.orderIndex)],
);

/* ════════════════════════════════════════════════════════════ 3. SESSIONI ══ */

export const workoutSessions = sqliteTable(
  'workout_sessions',
  {
    id: text('id').primaryKey(),
    /** Da dove è partita; nulli se è un allenamento libero. */
    routineId: text('routine_id').references(() => routines.id, { onDelete: 'set null' }),
    routineDayId: text('routine_day_id').references(() => routineDays.id, { onDelete: 'set null' }),

    name: text('name').notNull(),
    startedAt: timestamp('started_at').notNull(),
    endedAt: timestamp('ended_at'),
    /** Durata effettiva in secondi, congelata alla chiusura della sessione. */
    durationSeconds: integer('duration_seconds'),

    /**
     * `active` = sessione in corso. Ce n'è al massimo una: è ciò che permette
     * di riprendere l'allenamento dopo che l'app è stata chiusa o è crashata.
     */
    status: text('status').$type<SessionStatus>().notNull().default('active'),

    notes: text('notes'),
    /** Peso corporeo del giorno: serve ai calcoli sul corpo libero. */
    bodyweight: real('bodyweight'),
    /** Sforzo percepito sull'intera seduta, 1-10. */
    perceivedEffort: integer('perceived_effort'),

    /** Totali denormalizzati, ricalcolati a fine sessione per liste e grafici. */
    totalVolume: real('total_volume').notNull().default(0),
    totalSets: integer('total_sets').notNull().default(0),
    totalReps: integer('total_reps').notNull().default(0),

    createdAt: timestamp('created_at').notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('idx_sessions_started').on(t.startedAt),
    index('idx_sessions_status').on(t.status),
  ],
);

export const sessionExercises = sqliteTable(
  'session_exercises',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    orderIndex: integer('order_index').notNull().default(0),
    supersetGroup: integer('superset_group'),
    restSeconds: integer('rest_seconds'),
    notes: text('notes'),
  },
  (t) => [
    index('idx_session_exercises_session').on(t.sessionId, t.orderIndex),
    index('idx_session_exercises_exercise').on(t.exerciseId),
  ],
);

/**
 * La serie effettivamente eseguita. È la tabella centrale dell'app: tutto lo
 * storico, i record e le statistiche si calcolano da qui.
 *
 * `parentSetId` è il meccanismo che copre le serie estese. Drop set,
 * rest-pause, myo-reps e cluster non hanno tabelle dedicate: sono figli della
 * serie che li ha generati. Il volume somma padre e figli, il conteggio delle
 * serie allenanti guarda solo i padri, e la UI collassa il gruppo in una riga
 * sola (`100×8 → 80×5 → 60×4`).
 */
export const sessionSets = sqliteTable(
  'session_sets',
  {
    id: text('id').primaryKey(),
    sessionExerciseId: text('session_exercise_id')
      .notNull()
      .references(() => sessionExercises.id, { onDelete: 'cascade' }),
    /** Valorizzato solo sui segmenti di una serie estesa. */
    parentSetId: text('parent_set_id').references((): AnySQLiteColumn => sessionSets.id, {
      onDelete: 'cascade',
    }),
    orderIndex: integer('order_index').notNull().default(0),

    setType: text('set_type').$type<SetType>().notNull().default('working'),
    technique: text('technique').$type<Technique>(),

    /** In kg. Negativo per il corpo libero assistito (es. −15 alla macchina). */
    weight: real('weight'),
    reps: integer('reps'),
    rpe: real('rpe'),
    rir: integer('rir'),
    durationSeconds: integer('duration_seconds'),
    distanceMeters: real('distance_meters'),

    /**
     * Una riga esiste appena viene mostrata in sessione; conta solo quando
     * l'utente la spunta. Le righe non spuntate vengono scartate alla chiusura.
     */
    isCompleted: bool('is_completed').notNull().default(false),
    /** Cache: questa serie ha stabilito almeno un record. */
    isPr: bool('is_pr').notNull().default(false),

    notes: text('notes'),
    completedAt: timestamp('completed_at'),
  },
  (t) => [
    index('idx_session_sets_exercise').on(t.sessionExerciseId, t.orderIndex),
    index('idx_session_sets_parent').on(t.parentSetId),
    index('idx_session_sets_completed').on(t.completedAt),
  ],
);

/* ══════════════════════════════════════════════════════════════ 4. RECORD ══ */

/**
 * Cache dei record personali. È interamente ricostruibile da `sessionSets`
 * (vedi `features/stats`), ma tenerla materializzata è ciò che permette di
 * mostrare il badge 🏆 nell'istante in cui si spunta la serie.
 *
 * Per `rep_max` la colonna `reps` è la chiave: una riga per ogni numero di
 * ripetizioni. Per gli altri tipi vale 0 — non NULL, altrimenti l'indice
 * univoco non morderebbe (in SQLite i NULL sono tutti distinti fra loro).
 */
export const personalRecords = sqliteTable(
  'personal_records',
  {
    id: text('id').primaryKey(),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'cascade' }),
    type: text('type').$type<PrType>().notNull(),
    /** Chiave per `rep_max`, 0 per tutti gli altri tipi. */
    reps: integer('reps').notNull().default(0),

    /** Il valore del record: kg, kg stimati o volume, a seconda del tipo. */
    value: real('value').notNull(),
    /** Contesto leggibile: con che carico e quante ripetizioni è stato fatto. */
    weight: real('weight'),
    achievedReps: integer('achieved_reps'),

    sessionSetId: text('session_set_id').references(() => sessionSets.id, { onDelete: 'set null' }),
    sessionId: text('session_id').references(() => workoutSessions.id, { onDelete: 'set null' }),
    achievedAt: timestamp('achieved_at').notNull(),
    /** Valore precedente, per mostrare "+2.5 kg" accanto al record. */
    previousValue: real('previous_value'),
  },
  (t) => [
    uniqueIndex('uq_pr_exercise_type_reps').on(t.exerciseId, t.type, t.reps),
    index('idx_pr_exercise').on(t.exerciseId),
  ],
);

/* ══════════════════════════════════════════════════════════════ 5. CORPO ══ */

export const bodyMeasurements = sqliteTable(
  'body_measurements',
  {
    id: text('id').primaryKey(),
    /** `YYYY-MM-DD`: una misurazione al giorno, sovrascritta se ripetuta. */
    measuredOn: text('measured_on').notNull(),
    weight: real('weight'),
    bodyFat: real('body_fat'),
    neck: real('neck'),
    chest: real('chest'),
    waist: real('waist'),
    hips: real('hips'),
    armLeft: real('arm_left'),
    armRight: real('arm_right'),
    thighLeft: real('thigh_left'),
    thighRight: real('thigh_right'),
    calf: real('calf'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [uniqueIndex('uq_body_measured_on').on(t.measuredOn)],
);

/* ═════════════════════════════════════════════════════════ 6. IMPOSTAZIONI ══ */

/** Un disco disponibile in palestra e quanti se ne hanno per lato. */
export type PlateSpec = { weight: number; count: number };

/**
 * Riga unica (`id = 1`) con profilo e preferenze. Una tabella invece di una
 * chiave-valore così i tipi sono veri e la lettura è una query sola.
 */
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),

  /* profilo */
  userName: text('user_name'),
  birthYear: integer('birth_year'),
  heightCm: real('height_cm'),
  goal: text('goal'),
  experience: text('experience'),

  /* unità e aspetto */
  unit: text('unit').$type<WeightUnit>().notNull().default('kg'),
  accent: text('accent').$type<AccentKey>().notNull().default('volt'),

  /* recupero */
  defaultRestSeconds: integer('default_rest_seconds').notNull().default(90),
  autoStartTimer: bool('auto_start_timer').notNull().default(true),
  timerSound: bool('timer_sound').notNull().default(true),
  timerVibration: bool('timer_vibration').notNull().default(true),
  /** Notifica locale a fine recupero: fa suonare l'app anche a schermo spento. */
  timerNotification: bool('timer_notification').notNull().default(true),

  /* sessione */
  effortScale: text('effort_scale').$type<EffortScale>().notNull().default('rpe'),
  /** Tiene lo schermo acceso durante l'allenamento. */
  keepAwake: bool('keep_awake').notNull().default(true),
  /** Precompila carico e ripetizioni con quelli della volta precedente. */
  prefillFromPrevious: bool('prefill_from_previous').notNull().default(true),

  /* calcolatore dischi */
  barWeight: real('bar_weight').notNull().default(20),
  plateInventory: text('plate_inventory', { mode: 'json' })
    .$type<PlateSpec[]>()
    .notNull()
    .default(sql`'[]'`),

  /* varie */
  firstDayOfWeek: integer('first_day_of_week').notNull().default(1),
  weeklySessionGoal: integer('weekly_session_goal').notNull().default(4),
  onboardingCompleted: bool('onboarding_completed').notNull().default(false),
});

/* ═══════════════════════════════════════════════════════════════ tipi ORM ══ */

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;

export type Routine = typeof routines.$inferSelect;
export type NewRoutine = typeof routines.$inferInsert;
export type RoutineDay = typeof routineDays.$inferSelect;
export type NewRoutineDay = typeof routineDays.$inferInsert;
export type RoutineExercise = typeof routineExercises.$inferSelect;
export type NewRoutineExercise = typeof routineExercises.$inferInsert;
export type RoutineSet = typeof routineSets.$inferSelect;
export type NewRoutineSet = typeof routineSets.$inferInsert;

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type NewWorkoutSession = typeof workoutSessions.$inferInsert;
export type SessionExercise = typeof sessionExercises.$inferSelect;
export type NewSessionExercise = typeof sessionExercises.$inferInsert;
export type SessionSet = typeof sessionSets.$inferSelect;
export type NewSessionSet = typeof sessionSets.$inferInsert;

export type PersonalRecord = typeof personalRecords.$inferSelect;
export type NewPersonalRecord = typeof personalRecords.$inferInsert;

export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;
export type NewBodyMeasurement = typeof bodyMeasurements.$inferInsert;

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
