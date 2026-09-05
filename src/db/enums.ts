/**
 * Vocabolario del dominio palestra.
 *
 * Sono union di stringhe, non enum TS: finiscono in colonne SQLite `text` e
 * nei JSON di backup, quindi i valori sono stabili e non vanno mai rinominati
 * senza una migrazione. Le etichette italiane stanno qui accanto ai valori
 * così la UI non se le reinventa a ogni schermata.
 */

/* ------------------------------------------------------------------ muscoli */

export const MUSCLES = [
  'chest',
  'front_delts',
  'side_delts',
  'rear_delts',
  'lats',
  'traps',
  'lower_back',
  'biceps',
  'triceps',
  'forearms',
  'quads',
  'hamstrings',
  'glutes',
  'adductors',
  'abductors',
  'calves',
  'abs',
  'obliques',
  'neck',
  'cardio',
] as const;

export type Muscle = (typeof MUSCLES)[number];

export const MUSCLE_LABELS: Record<Muscle, string> = {
  chest: 'Petto',
  front_delts: 'Deltoidi anteriori',
  side_delts: 'Deltoidi laterali',
  rear_delts: 'Deltoidi posteriori',
  lats: 'Dorsali',
  traps: 'Trapezi',
  lower_back: 'Lombari',
  biceps: 'Bicipiti',
  triceps: 'Tricipiti',
  forearms: 'Avambracci',
  quads: 'Quadricipiti',
  hamstrings: 'Femorali',
  glutes: 'Glutei',
  adductors: 'Adduttori',
  abductors: 'Abduttori',
  calves: 'Polpacci',
  abs: 'Addominali',
  obliques: 'Obliqui',
  neck: 'Collo',
  cardio: 'Cardio',
};

/**
 * Raggruppamento grosso per i filtri e per le statistiche "serie per gruppo".
 * Il muscolo resta granulare nel dato; questa mappa serve solo a presentarlo.
 */
export const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'other'] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Petto',
  back: 'Schiena',
  shoulders: 'Spalle',
  arms: 'Braccia',
  legs: 'Gambe',
  core: 'Core',
  other: 'Altro',
};

export const MUSCLE_TO_GROUP: Record<Muscle, MuscleGroup> = {
  chest: 'chest',
  lats: 'back',
  traps: 'back',
  lower_back: 'back',
  front_delts: 'shoulders',
  side_delts: 'shoulders',
  rear_delts: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  adductors: 'legs',
  abductors: 'legs',
  calves: 'legs',
  abs: 'core',
  obliques: 'core',
  neck: 'other',
  cardio: 'other',
};

/* ----------------------------------------------------------------- attrezzi */

export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'smith',
  'bodyweight',
  'kettlebell',
  'band',
  'ez_bar',
  'trap_bar',
  'plate',
  'other',
] as const;

export type Equipment = (typeof EQUIPMENT)[number];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Bilanciere',
  dumbbell: 'Manubri',
  machine: 'Macchina',
  cable: 'Cavi',
  smith: 'Multipower',
  bodyweight: 'Corpo libero',
  kettlebell: 'Kettlebell',
  band: 'Elastico',
  ez_bar: 'Bilanciere EZ',
  trap_bar: 'Trap bar',
  plate: 'Disco',
  other: 'Altro',
};

/** Attrezzi su cui ha senso proporre il calcolatore dei dischi. */
export const PLATE_LOADED_EQUIPMENT: readonly Equipment[] = ['barbell', 'ez_bar', 'trap_bar', 'smith'];

/* ------------------------------------------------------------------ mechanic */

export type Mechanic = 'compound' | 'isolation';

export const MECHANIC_LABELS: Record<Mechanic, string> = {
  compound: 'Multiarticolare',
  isolation: 'Isolamento',
};

/* ------------------------------------------------------- come si misura il set */

/**
 * Determina quali campi la sessione chiede per ogni serie e come si calcola
 * il volume. È la proprietà che rende loggabili sia una panca sia un plank.
 */
export const TRACKING_TYPES = [
  /** Carico esterno × ripetizioni. Panca, squat, curl. */
  'weight_reps',
  /** Solo ripetizioni: il carico è il corpo. Piegamenti, addominali. */
  'bodyweight_reps',
  /** Corpo libero con sovraccarico: dip +20 kg, trazioni zavorrate. */
  'weighted_bodyweight',
  /** Corpo libero assistito: trazioni alla macchina −15 kg. */
  'assisted_bodyweight',
  /** Solo tempo. Plank, hollow hold. */
  'duration',
  /** Tempo sotto un carico. Farmer's walk a tempo, iso con manubri. */
  'weight_duration',
  /** Distanza e tempo. Corsa, vogatore, camminata in pendenza. */
  'distance_duration',
] as const;

export type TrackingType = (typeof TRACKING_TYPES)[number];

export const TRACKING_TYPE_LABELS: Record<TrackingType, string> = {
  weight_reps: 'Carico × ripetizioni',
  bodyweight_reps: 'Corpo libero',
  weighted_bodyweight: 'Corpo libero zavorrato',
  assisted_bodyweight: 'Corpo libero assistito',
  duration: 'A tempo',
  weight_duration: 'Carico a tempo',
  distance_duration: 'Distanza e tempo',
};

/** Il set chiede un campo carico? */
export function usesWeight(t: TrackingType): boolean {
  return (
    t === 'weight_reps' ||
    t === 'weighted_bodyweight' ||
    t === 'assisted_bodyweight' ||
    t === 'weight_duration'
  );
}

/** Il set chiede un campo ripetizioni? */
export function usesReps(t: TrackingType): boolean {
  return t === 'weight_reps' || t === 'bodyweight_reps' || t === 'weighted_bodyweight' || t === 'assisted_bodyweight';
}

/** Il set chiede una durata? */
export function usesDuration(t: TrackingType): boolean {
  return t === 'duration' || t === 'weight_duration' || t === 'distance_duration';
}

/** Il set chiede una distanza? */
export function usesDistance(t: TrackingType): boolean {
  return t === 'distance_duration';
}

/* ---------------------------------------------------------------- tipi di set */

/**
 * Il *ruolo* di una serie.
 *
 * I primi valori descrivono serie di primo livello (righe della tabella in
 * sessione). Gli ultimi quattro descrivono i segmenti di una serie estesa:
 * esistono solo come figli, con `parentSetId` valorizzato, e non contano mai
 * come serie a sé nel conteggio delle serie allenanti.
 */
export const SET_TYPES = [
  /** Riscaldamento: escluso da volume allenante, serie e record. */
  'warmup',
  /** Serie allenante standard. */
  'working',
  /** La serie pesante di giornata, di solito unica e a ripetizioni basse. */
  'top_set',
  /** Serie di scarico dopo la top set, stesso esercizio a carico ridotto. */
  'back_off',
  /** A esaurimento: si registrano le ripetizioni fatte, non un target. */
  'amrap',
  /** Portata a cedimento tecnico. */
  'failure',
  /** Ripetizioni parziali, di solito in coda a una serie completa. */
  'partial',
  /** Isometria: si misura il tempo di tenuta. */
  'iso_hold',

  /* --- segmenti di una serie estesa (sempre figli di un'altra serie) --- */
  /** Scalino di uno stripping: carico ridotto, nessun recupero. */
  'drop',
  /** Ripartenza di un rest-pause dopo 10-20 s. */
  'rest_pause',
  /** Mini-serie di myo-reps dopo la serie di attivazione. */
  'myo_rep',
  /** Blocco di un cluster con micro-pausa fra i blocchi. */
  'cluster',
] as const;

export type SetType = (typeof SET_TYPES)[number];

export const SET_TYPE_LABELS: Record<SetType, string> = {
  warmup: 'Riscaldamento',
  working: 'Allenante',
  top_set: 'Top set',
  back_off: 'Back-off',
  amrap: 'AMRAP',
  failure: 'A cedimento',
  partial: 'Parziali',
  iso_hold: 'Isometria',
  drop: 'Drop',
  rest_pause: 'Rest-pause',
  myo_rep: 'Myo-rep',
  cluster: 'Cluster',
};

/**
 * Sigla mostrata al posto del numero di serie nella tabella della sessione.
 * `working` non ha sigla: mostra il progressivo (1, 2, 3…).
 */
export const SET_TYPE_BADGE: Record<SetType, string> = {
  warmup: 'R',
  working: '',
  top_set: 'TOP',
  back_off: 'BO',
  amrap: 'AM',
  failure: 'CED',
  partial: 'PAR',
  iso_hold: 'ISO',
  drop: 'D',
  rest_pause: 'RP',
  myo_rep: 'MYO',
  cluster: 'CL',
};

/** Serie di primo livello: sono le uniche selezionabili dal menu della riga. */
export const TOP_LEVEL_SET_TYPES: readonly SetType[] = [
  'warmup',
  'working',
  'top_set',
  'back_off',
  'amrap',
  'failure',
  'partial',
  'iso_hold',
];

/** Tipi che esistono solo come figli di una serie estesa. */
export const CHILD_SET_TYPES: readonly SetType[] = ['drop', 'rest_pause', 'myo_rep', 'cluster'];

export function isChildSetType(t: SetType): boolean {
  return CHILD_SET_TYPES.includes(t);
}

/**
 * Una serie di riscaldamento non allena: fuori da volume, conteggio serie e
 * record. Tutto il resto conta, figli inclusi (il volume di uno stripping è
 * reale), ma solo le serie di primo livello contano come "serie allenanti".
 */
export function countsAsWorkingSet(t: SetType): boolean {
  return t !== 'warmup' && !isChildSetType(t);
}

export function countsTowardVolume(t: SetType): boolean {
  return t !== 'warmup';
}

/* ------------------------------------------------- tecniche di intensificazione */

/**
 * Tecnica applicata a una serie di primo livello. Dice alla UI che quella
 * serie può avere dei figli e che sigla dare loro.
 */
export const TECHNIQUES = ['drop_set', 'rest_pause', 'myo_reps', 'cluster'] as const;

export type Technique = (typeof TECHNIQUES)[number];

export const TECHNIQUE_LABELS: Record<Technique, string> = {
  drop_set: 'Drop set',
  rest_pause: 'Rest-pause',
  myo_reps: 'Myo-reps',
  cluster: 'Cluster set',
};

export const TECHNIQUE_DESCRIPTIONS: Record<Technique, string> = {
  drop_set: 'Arrivi a cedimento, cali il carico e riparti senza recupero.',
  rest_pause: 'Cedimento, 10-20 s di pausa, riparti con lo stesso carico.',
  myo_reps: 'Una serie di attivazione seguita da mini-serie da 3-5 ripetizioni.',
  cluster: 'La serie è spezzata in blocchi con micro-pause fra uno e l’altro.',
};

/** Il tipo da assegnare ai figli generati da una tecnica. */
export const TECHNIQUE_CHILD_TYPE: Record<Technique, SetType> = {
  drop_set: 'drop',
  rest_pause: 'rest_pause',
  myo_reps: 'myo_rep',
  cluster: 'cluster',
};

/* ------------------------------------------------------------------- record */

export const PR_TYPES = [
  /** Carico massimo mai sollevato sull'esercizio, a qualsiasi ripetizione. */
  'best_weight',
  /** Massimale stimato più alto. */
  'best_e1rm',
  /** Carico massimo per un dato numero di ripetizioni (colonna `reps`). */
  'rep_max',
  /** Volume più alto accumulato sull'esercizio in una singola sessione. */
  'best_session_volume',
] as const;

export type PrType = (typeof PR_TYPES)[number];

export const PR_TYPE_LABELS: Record<PrType, string> = {
  best_weight: 'Carico massimo',
  best_e1rm: 'Massimale stimato',
  rep_max: 'Record di ripetizioni',
  best_session_volume: 'Volume in sessione',
};

/* ------------------------------------------------------------- preferenze varie */

export type WeightUnit = 'kg' | 'lb';

/** Scala con cui si misura lo sforzo. */
export const EFFORT_SCALES = ['rpe', 'rir', 'none'] as const;

export type EffortScale = (typeof EFFORT_SCALES)[number];

/** Per esteso: impostazioni, dove c'è spazio per spiegare. */
export const EFFORT_SCALE_LABELS: Record<EffortScale, string> = {
  rpe: 'RPE (1-10)',
  rir: 'RIR (ripetizioni in riserva)',
  none: 'Non registrare',
};

/** Per le pillole, dove la riga è stretta e la sigla si capisce da sola. */
export const EFFORT_SCALE_SHORT: Record<EffortScale, string> = {
  rpe: 'RPE',
  rir: 'RIR',
  none: 'Nessuno',
};

export type SessionStatus = 'active' | 'completed';
