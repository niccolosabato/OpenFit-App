/**
 * Libreria esercizi precaricata.
 *
 * Gli `id` sono slug stabili, non UUID: il seed è idempotente e può essere
 * rieseguito a ogni aggiornamento dell'app per aggiungere esercizi nuovi
 * senza duplicare quelli esistenti né toccare quelli creati dall'utente
 * (che hanno UUID e `isCustom = true`).
 *
 * `aliases` esiste perché in palestra la stessa cosa ha tre nomi: chi cerca
 * "pulldown" o "lat machine" deve trovare lo stesso esercizio.
 */

import type { Equipment, Mechanic, Muscle, TrackingType } from '../enums';

export type SeedExercise = {
  id: string;
  name: string;
  aliases?: string;
  primaryMuscle: Muscle;
  secondaryMuscles?: Muscle[];
  equipment: Equipment;
  mechanic?: Mechanic;
  trackingType?: TrackingType;
  isUnilateral?: boolean;
  defaultRestSeconds?: number;
};

export const SEED_EXERCISES: SeedExercise[] = [
  /* ───────────────────────────────────────────────────────────── PETTO ── */
  { id: 'panca-piana-bilanciere', name: 'Panca piana con bilanciere', aliases: 'bench press;panca piana', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'front_delts'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 150 },
  { id: 'panca-piana-manubri', name: 'Panca piana con manubri', aliases: 'dumbbell bench press', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'front_delts'], equipment: 'dumbbell', mechanic: 'compound', defaultRestSeconds: 120 },
  { id: 'panca-inclinata-bilanciere', name: 'Panca inclinata con bilanciere', aliases: 'incline bench press', primaryMuscle: 'chest', secondaryMuscles: ['front_delts', 'triceps'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 150 },
  { id: 'panca-inclinata-manubri', name: 'Panca inclinata con manubri', aliases: 'incline dumbbell press', primaryMuscle: 'chest', secondaryMuscles: ['front_delts', 'triceps'], equipment: 'dumbbell', mechanic: 'compound', defaultRestSeconds: 120 },
  { id: 'panca-declinata-bilanciere', name: 'Panca declinata con bilanciere', aliases: 'decline bench press', primaryMuscle: 'chest', secondaryMuscles: ['triceps'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 150 },
  { id: 'panca-declinata-manubri', name: 'Panca declinata con manubri', primaryMuscle: 'chest', secondaryMuscles: ['triceps'], equipment: 'dumbbell', mechanic: 'compound', defaultRestSeconds: 120 },
  { id: 'panca-piana-multipower', name: 'Panca piana al multipower', aliases: 'smith machine bench', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'front_delts'], equipment: 'smith', mechanic: 'compound', defaultRestSeconds: 120 },
  { id: 'chest-press', name: 'Chest press', aliases: 'pectoral press;spinte macchina', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'front_delts'], equipment: 'machine', mechanic: 'compound', defaultRestSeconds: 90 },
  { id: 'chest-press-inclinata', name: 'Chest press inclinata', primaryMuscle: 'chest', secondaryMuscles: ['front_delts', 'triceps'], equipment: 'machine', mechanic: 'compound', defaultRestSeconds: 90 },
  { id: 'croci-cavi', name: 'Croci ai cavi', aliases: 'cable fly;cross over', primaryMuscle: 'chest', equipment: 'cable', defaultRestSeconds: 75 },
  { id: 'croci-cavi-alte', name: 'Croci ai cavi dall’alto', aliases: 'high to low cable fly', primaryMuscle: 'chest', equipment: 'cable', defaultRestSeconds: 75 },
  { id: 'croci-cavi-basse', name: 'Croci ai cavi dal basso', aliases: 'low to high cable fly', primaryMuscle: 'chest', secondaryMuscles: ['front_delts'], equipment: 'cable', defaultRestSeconds: 75 },
  { id: 'croci-panca-piana', name: 'Croci su panca piana', aliases: 'dumbbell fly', primaryMuscle: 'chest', equipment: 'dumbbell', defaultRestSeconds: 90 },
  { id: 'croci-panca-inclinata', name: 'Croci su panca inclinata', primaryMuscle: 'chest', secondaryMuscles: ['front_delts'], equipment: 'dumbbell', defaultRestSeconds: 90 },
  { id: 'pectoral-machine', name: 'Pectoral machine', aliases: 'peck deck;butterfly', primaryMuscle: 'chest', equipment: 'machine', defaultRestSeconds: 75 },
  { id: 'piegamenti', name: 'Piegamenti sulle braccia', aliases: 'push up;flessioni', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'front_delts', 'abs'], equipment: 'bodyweight', mechanic: 'compound', trackingType: 'weighted_bodyweight', defaultRestSeconds: 90 },
  { id: 'dip-petto', name: 'Dip alle parallele per il petto', aliases: 'dip;parallele', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'front_delts'], equipment: 'bodyweight', mechanic: 'compound', trackingType: 'weighted_bodyweight', defaultRestSeconds: 120 },
  { id: 'pullover-manubrio', name: 'Pullover con manubrio', primaryMuscle: 'chest', secondaryMuscles: ['lats', 'triceps'], equipment: 'dumbbell', defaultRestSeconds: 90 },

  /* ─────────────────────────────────────────────────────────── SCHIENA ── */
  { id: 'trazioni-prona', name: 'Trazioni presa prona', aliases: 'pull up;pullup', primaryMuscle: 'lats', secondaryMuscles: ['biceps', 'traps', 'rear_delts'], equipment: 'bodyweight', mechanic: 'compound', trackingType: 'weighted_bodyweight', defaultRestSeconds: 150 },
  { id: 'trazioni-supina', name: 'Trazioni presa supina', aliases: 'chin up;chinup', primaryMuscle: 'lats', secondaryMuscles: ['biceps'], equipment: 'bodyweight', mechanic: 'compound', trackingType: 'weighted_bodyweight', defaultRestSeconds: 150 },
  { id: 'trazioni-neutra', name: 'Trazioni presa neutra', primaryMuscle: 'lats', secondaryMuscles: ['biceps', 'traps'], equipment: 'bodyweight', mechanic: 'compound', trackingType: 'weighted_bodyweight', defaultRestSeconds: 150 },
  { id: 'trazioni-assistite', name: 'Trazioni alla macchina assistita', aliases: 'assisted pull up;gravitron', primaryMuscle: 'lats', secondaryMuscles: ['biceps'], equipment: 'machine', mechanic: 'compound', trackingType: 'assisted_bodyweight', defaultRestSeconds: 120 },
  { id: 'lat-machine-avanti', name: 'Lat machine avanti', aliases: 'lat pulldown;pulldown', primaryMuscle: 'lats', secondaryMuscles: ['biceps', 'rear_delts'], equipment: 'cable', mechanic: 'compound', defaultRestSeconds: 105 },
  { id: 'lat-machine-presa-stretta', name: 'Lat machine presa stretta', aliases: 'close grip pulldown', primaryMuscle: 'lats', secondaryMuscles: ['biceps'], equipment: 'cable', mechanic: 'compound', defaultRestSeconds: 105 },
  { id: 'lat-machine-presa-inversa', name: 'Lat machine presa inversa', aliases: 'reverse grip pulldown', primaryMuscle: 'lats', secondaryMuscles: ['biceps'], equipment: 'cable', mechanic: 'compound', defaultRestSeconds: 105 },
  { id: 'pulley-basso', name: 'Pulley basso', aliases: 'seated cable row;rematore ai cavi', primaryMuscle: 'lats', secondaryMuscles: ['traps', 'biceps', 'rear_delts'], equipment: 'cable', mechanic: 'compound', defaultRestSeconds: 105 },
  { id: 'rematore-bilanciere', name: 'Rematore con bilanciere', aliases: 'barbell row;bent over row', primaryMuscle: 'lats', secondaryMuscles: ['traps', 'rear_delts', 'biceps', 'lower_back'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 150 },
  { id: 'rematore-bilanciere-supino', name: 'Rematore con bilanciere presa supina', aliases: 'yates row', primaryMuscle: 'lats', secondaryMuscles: ['biceps', 'traps'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 150 },
  { id: 'rematore-manubrio', name: 'Rematore con manubrio', aliases: 'one arm dumbbell row', primaryMuscle: 'lats', secondaryMuscles: ['traps', 'biceps'], equipment: 'dumbbell', mechanic: 'compound', isUnilateral: true, defaultRestSeconds: 105 },
  { id: 'rematore-t-bar', name: 'Rematore T-bar', aliases: 't bar row', primaryMuscle: 'lats', secondaryMuscles: ['traps', 'biceps'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 120 },
  { id: 'rematore-macchina', name: 'Rematore alla macchina', aliases: 'machine row;hammer row', primaryMuscle: 'lats', secondaryMuscles: ['traps', 'biceps'], equipment: 'machine', mechanic: 'compound', defaultRestSeconds: 105 },
  { id: 'rematore-pendlay', name: 'Pendlay row', primaryMuscle: 'lats', secondaryMuscles: ['traps', 'lower_back'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 150 },
  { id: 'seal-row', name: 'Seal row', primaryMuscle: 'lats', secondaryMuscles: ['traps', 'rear_delts'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 120 },
  { id: 'pulldown-braccia-tese', name: 'Pulldown a braccia tese', aliases: 'straight arm pulldown', primaryMuscle: 'lats', secondaryMuscles: ['triceps'], equipment: 'cable', defaultRestSeconds: 75 },
  { id: 'pullover-cavi', name: 'Pullover ai cavi', primaryMuscle: 'lats', secondaryMuscles: ['chest'], equipment: 'cable', defaultRestSeconds: 75 },
  { id: 'stacco-da-terra', name: 'Stacco da terra', aliases: 'deadlift;stacco convenzionale', primaryMuscle: 'lower_back', secondaryMuscles: ['glutes', 'hamstrings', 'traps', 'quads'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 210 },
  { id: 'stacco-sumo', name: 'Stacco sumo', aliases: 'sumo deadlift', primaryMuscle: 'glutes', secondaryMuscles: ['quads', 'hamstrings', 'lower_back', 'adductors'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 210 },
  { id: 'rack-pull', name: 'Rack pull', primaryMuscle: 'lower_back', secondaryMuscles: ['traps', 'glutes'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 180 },
  { id: 'iperestensioni', name: 'Iperestensioni', aliases: 'hyperextension;back extension;lombari', primaryMuscle: 'lower_back', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'bodyweight', trackingType: 'weighted_bodyweight', defaultRestSeconds: 75 },
  { id: 'good-morning', name: 'Good morning', primaryMuscle: 'hamstrings', secondaryMuscles: ['lower_back', 'glutes'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 120 },
  { id: 'scrollate-bilanciere', name: 'Scrollate con bilanciere', aliases: 'shrug;barbell shrug', primaryMuscle: 'traps', equipment: 'barbell', defaultRestSeconds: 90 },
  { id: 'scrollate-manubri', name: 'Scrollate con manubri', aliases: 'dumbbell shrug', primaryMuscle: 'traps', equipment: 'dumbbell', defaultRestSeconds: 90 },
  { id: 'scrollate-macchina', name: 'Scrollate alla macchina', primaryMuscle: 'traps', equipment: 'machine', defaultRestSeconds: 75 },

  /* ───────────────────────────────────────────────────────────── SPALLE ── */
  { id: 'lento-avanti-bilanciere', name: 'Lento avanti con bilanciere', aliases: 'overhead press;military press;ohp', primaryMuscle: 'front_delts', secondaryMuscles: ['triceps', 'side_delts', 'abs'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 150 },
  { id: 'lento-avanti-manubri', name: 'Lento avanti con manubri', aliases: 'dumbbell shoulder press', primaryMuscle: 'front_delts', secondaryMuscles: ['triceps', 'side_delts'], equipment: 'dumbbell', mechanic: 'compound', defaultRestSeconds: 120 },
  { id: 'lento-avanti-multipower', name: 'Lento avanti al multipower', primaryMuscle: 'front_delts', secondaryMuscles: ['triceps'], equipment: 'smith', mechanic: 'compound', defaultRestSeconds: 120 },
  { id: 'shoulder-press-macchina', name: 'Shoulder press alla macchina', primaryMuscle: 'front_delts', secondaryMuscles: ['triceps', 'side_delts'], equipment: 'machine', mechanic: 'compound', defaultRestSeconds: 90 },
  { id: 'arnold-press', name: 'Arnold press', primaryMuscle: 'front_delts', secondaryMuscles: ['side_delts', 'triceps'], equipment: 'dumbbell', mechanic: 'compound', defaultRestSeconds: 120 },
  { id: 'push-press', name: 'Push press', primaryMuscle: 'front_delts', secondaryMuscles: ['triceps', 'quads', 'glutes'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 180 },
  { id: 'alzate-laterali-manubri', name: 'Alzate laterali con manubri', aliases: 'lateral raise;alzate laterali', primaryMuscle: 'side_delts', equipment: 'dumbbell', defaultRestSeconds: 60 },
  { id: 'alzate-laterali-cavi', name: 'Alzate laterali ai cavi', aliases: 'cable lateral raise', primaryMuscle: 'side_delts', equipment: 'cable', isUnilateral: true, defaultRestSeconds: 60 },
  { id: 'alzate-laterali-macchina', name: 'Alzate laterali alla macchina', primaryMuscle: 'side_delts', equipment: 'machine', defaultRestSeconds: 60 },
  { id: 'alzate-frontali-manubri', name: 'Alzate frontali con manubri', aliases: 'front raise', primaryMuscle: 'front_delts', equipment: 'dumbbell', defaultRestSeconds: 60 },
  { id: 'alzate-frontali-bilanciere', name: 'Alzate frontali con bilanciere', primaryMuscle: 'front_delts', equipment: 'barbell', defaultRestSeconds: 60 },
  { id: 'alzate-posteriori-manubri', name: 'Alzate posteriori con manubri', aliases: 'rear delt fly;alzate a 90 gradi', primaryMuscle: 'rear_delts', secondaryMuscles: ['traps'], equipment: 'dumbbell', defaultRestSeconds: 60 },
  { id: 'reverse-pec-deck', name: 'Reverse pec deck', aliases: 'rear delt machine;pectoral inverso', primaryMuscle: 'rear_delts', secondaryMuscles: ['traps'], equipment: 'machine', defaultRestSeconds: 60 },
  { id: 'face-pull', name: 'Face pull', primaryMuscle: 'rear_delts', secondaryMuscles: ['traps'], equipment: 'cable', defaultRestSeconds: 60 },
  { id: 'tirate-al-mento', name: 'Tirate al mento', aliases: 'upright row', primaryMuscle: 'side_delts', secondaryMuscles: ['traps', 'biceps'], equipment: 'barbell', defaultRestSeconds: 90 },

  /* ───────────────────────────────────────────────────────────── BICIPITI ── */
  { id: 'curl-bilanciere', name: 'Curl con bilanciere', aliases: 'barbell curl', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'barbell', defaultRestSeconds: 90 },
  { id: 'curl-ez', name: 'Curl con bilanciere EZ', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'ez_bar', defaultRestSeconds: 90 },
  { id: 'curl-manubri', name: 'Curl con manubri', aliases: 'dumbbell curl', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'dumbbell', defaultRestSeconds: 75 },
  { id: 'curl-alternato', name: 'Curl alternato con manubri', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'dumbbell', isUnilateral: true, defaultRestSeconds: 75 },
  { id: 'curl-martello', name: 'Curl a martello', aliases: 'hammer curl', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'dumbbell', defaultRestSeconds: 75 },
  { id: 'curl-panca-inclinata', name: 'Curl su panca inclinata', aliases: 'incline curl', primaryMuscle: 'biceps', equipment: 'dumbbell', defaultRestSeconds: 75 },
  { id: 'curl-concentrato', name: 'Curl concentrato', primaryMuscle: 'biceps', equipment: 'dumbbell', isUnilateral: true, defaultRestSeconds: 60 },
  { id: 'curl-scott', name: 'Curl alla panca Scott', aliases: 'preacher curl', primaryMuscle: 'biceps', equipment: 'ez_bar', defaultRestSeconds: 75 },
  { id: 'curl-cavi', name: 'Curl ai cavi', aliases: 'cable curl', primaryMuscle: 'biceps', equipment: 'cable', defaultRestSeconds: 60 },
  { id: 'curl-cavi-alto', name: 'Curl ai cavi dall’alto', aliases: 'bayesian curl', primaryMuscle: 'biceps', equipment: 'cable', isUnilateral: true, defaultRestSeconds: 60 },
  { id: 'spider-curl', name: 'Spider curl', primaryMuscle: 'biceps', equipment: 'dumbbell', defaultRestSeconds: 60 },
  { id: 'curl-inverso', name: 'Curl inverso', aliases: 'reverse curl', primaryMuscle: 'forearms', secondaryMuscles: ['biceps'], equipment: 'ez_bar', defaultRestSeconds: 60 },

  /* ───────────────────────────────────────────────────────────── TRICIPITI ── */
  { id: 'push-down-corda', name: 'Push down con corda', aliases: 'rope pushdown;tricipiti ai cavi', primaryMuscle: 'triceps', equipment: 'cable', defaultRestSeconds: 60 },
  { id: 'push-down-barra', name: 'Push down con barra', aliases: 'triceps pushdown', primaryMuscle: 'triceps', equipment: 'cable', defaultRestSeconds: 60 },
  { id: 'push-down-presa-inversa', name: 'Push down presa inversa', primaryMuscle: 'triceps', equipment: 'cable', defaultRestSeconds: 60 },
  { id: 'french-press-ez', name: 'French press con bilanciere EZ', aliases: 'skull crusher', primaryMuscle: 'triceps', equipment: 'ez_bar', defaultRestSeconds: 90 },
  { id: 'french-press-manubri', name: 'French press con manubri', primaryMuscle: 'triceps', equipment: 'dumbbell', defaultRestSeconds: 90 },
  { id: 'estensioni-sopra-la-testa-cavi', name: 'Estensioni sopra la testa ai cavi', aliases: 'overhead triceps extension', primaryMuscle: 'triceps', equipment: 'cable', defaultRestSeconds: 75 },
  { id: 'estensioni-sopra-la-testa-manubrio', name: 'Estensioni sopra la testa con manubrio', primaryMuscle: 'triceps', equipment: 'dumbbell', defaultRestSeconds: 75 },
  { id: 'panca-stretta', name: 'Panca a presa stretta', aliases: 'close grip bench press', primaryMuscle: 'triceps', secondaryMuscles: ['chest', 'front_delts'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 150 },
  { id: 'dip-tricipiti', name: 'Dip alle parallele per i tricipiti', primaryMuscle: 'triceps', secondaryMuscles: ['chest', 'front_delts'], equipment: 'bodyweight', mechanic: 'compound', trackingType: 'weighted_bodyweight', defaultRestSeconds: 120 },
  { id: 'dip-panca', name: 'Dip alla panca', aliases: 'bench dip', primaryMuscle: 'triceps', equipment: 'bodyweight', trackingType: 'weighted_bodyweight', defaultRestSeconds: 75 },
  { id: 'kickback', name: 'Kickback con manubrio', aliases: 'triceps kickback', primaryMuscle: 'triceps', equipment: 'dumbbell', isUnilateral: true, defaultRestSeconds: 60 },
  { id: 'triceps-machine', name: 'Estensioni tricipiti alla macchina', primaryMuscle: 'triceps', equipment: 'machine', defaultRestSeconds: 60 },

  /* ─────────────────────────────────────────────────────────── AVAMBRACCI ── */
  { id: 'curl-polsi', name: 'Curl dei polsi', aliases: 'wrist curl', primaryMuscle: 'forearms', equipment: 'barbell', defaultRestSeconds: 45 },
  { id: 'curl-polsi-inverso', name: 'Curl dei polsi inverso', primaryMuscle: 'forearms', equipment: 'barbell', defaultRestSeconds: 45 },
  { id: 'farmers-walk', name: 'Farmer’s walk', primaryMuscle: 'forearms', secondaryMuscles: ['traps', 'abs', 'glutes'], equipment: 'dumbbell', mechanic: 'compound', trackingType: 'weight_duration', defaultRestSeconds: 120 },
  { id: 'dead-hang', name: 'Sospensione alla sbarra', aliases: 'dead hang', primaryMuscle: 'forearms', secondaryMuscles: ['lats'], equipment: 'bodyweight', trackingType: 'duration', defaultRestSeconds: 90 },

  /* ─────────────────────────────────────────────────────────────── GAMBE ── */
  { id: 'squat-bilanciere', name: 'Squat con bilanciere', aliases: 'back squat;squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings', 'lower_back', 'abs'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 210 },
  { id: 'front-squat', name: 'Front squat', aliases: 'squat frontale', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'abs'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 180 },
  { id: 'squat-multipower', name: 'Squat al multipower', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'smith', mechanic: 'compound', defaultRestSeconds: 150 },
  { id: 'goblet-squat', name: 'Goblet squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'abs'], equipment: 'dumbbell', mechanic: 'compound', defaultRestSeconds: 120 },
  { id: 'hack-squat', name: 'Hack squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'machine', mechanic: 'compound', defaultRestSeconds: 150 },
  { id: 'pressa-45', name: 'Pressa 45°', aliases: 'leg press', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'machine', mechanic: 'compound', defaultRestSeconds: 150 },
  { id: 'pressa-orizzontale', name: 'Pressa orizzontale', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'machine', mechanic: 'compound', defaultRestSeconds: 120 },
  { id: 'pressa-unilaterale', name: 'Pressa unilaterale', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'machine', mechanic: 'compound', isUnilateral: true, defaultRestSeconds: 120 },
  { id: 'leg-extension', name: 'Leg extension', aliases: 'estensioni gambe', primaryMuscle: 'quads', equipment: 'machine', defaultRestSeconds: 75 },
  { id: 'affondi-manubri', name: 'Affondi con manubri', aliases: 'lunge', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'dumbbell', mechanic: 'compound', isUnilateral: true, defaultRestSeconds: 120 },
  { id: 'affondi-camminata', name: 'Affondi in camminata', aliases: 'walking lunge', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'dumbbell', mechanic: 'compound', defaultRestSeconds: 120 },
  { id: 'affondi-bulgari', name: 'Affondi bulgari', aliases: 'bulgarian split squat;split squat', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'dumbbell', mechanic: 'compound', isUnilateral: true, defaultRestSeconds: 120 },
  { id: 'step-up', name: 'Step up', aliases: 'salita al box', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'dumbbell', mechanic: 'compound', isUnilateral: true, defaultRestSeconds: 90 },
  { id: 'sissy-squat', name: 'Sissy squat', primaryMuscle: 'quads', equipment: 'bodyweight', trackingType: 'weighted_bodyweight', defaultRestSeconds: 75 },
  { id: 'stacco-rumeno', name: 'Stacco rumeno', aliases: 'romanian deadlift;rdl', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'lower_back'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 150 },
  { id: 'stacco-rumeno-manubri', name: 'Stacco rumeno con manubri', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'lower_back'], equipment: 'dumbbell', mechanic: 'compound', defaultRestSeconds: 120 },
  { id: 'stacco-gambe-tese', name: 'Stacco a gambe tese', aliases: 'stiff leg deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'lower_back'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 150 },
  { id: 'leg-curl-sdraiato', name: 'Leg curl sdraiato', aliases: 'lying leg curl', primaryMuscle: 'hamstrings', equipment: 'machine', defaultRestSeconds: 75 },
  { id: 'leg-curl-seduto', name: 'Leg curl seduto', aliases: 'seated leg curl', primaryMuscle: 'hamstrings', equipment: 'machine', defaultRestSeconds: 75 },
  { id: 'leg-curl-in-piedi', name: 'Leg curl in piedi', primaryMuscle: 'hamstrings', equipment: 'machine', isUnilateral: true, defaultRestSeconds: 60 },
  { id: 'nordic-curl', name: 'Nordic curl', primaryMuscle: 'hamstrings', equipment: 'bodyweight', trackingType: 'weighted_bodyweight', defaultRestSeconds: 120 },
  { id: 'hip-thrust', name: 'Hip thrust con bilanciere', aliases: 'ponte glutei', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings', 'quads'], equipment: 'barbell', mechanic: 'compound', defaultRestSeconds: 150 },
  { id: 'hip-thrust-macchina', name: 'Hip thrust alla macchina', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings'], equipment: 'machine', mechanic: 'compound', defaultRestSeconds: 120 },
  { id: 'glute-bridge', name: 'Glute bridge', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings'], equipment: 'bodyweight', trackingType: 'weighted_bodyweight', defaultRestSeconds: 90 },
  { id: 'kickback-glutei-cavi', name: 'Slanci glutei ai cavi', aliases: 'cable kickback', primaryMuscle: 'glutes', equipment: 'cable', isUnilateral: true, defaultRestSeconds: 60 },
  { id: 'abduzioni-macchina', name: 'Abduzioni alla macchina', aliases: 'hip abduction', primaryMuscle: 'abductors', secondaryMuscles: ['glutes'], equipment: 'machine', defaultRestSeconds: 60 },
  { id: 'adduzioni-macchina', name: 'Adduzioni alla macchina', aliases: 'hip adduction', primaryMuscle: 'adductors', equipment: 'machine', defaultRestSeconds: 60 },
  { id: 'calf-in-piedi', name: 'Calf raise in piedi', aliases: 'standing calf raise;polpacci in piedi', primaryMuscle: 'calves', equipment: 'machine', defaultRestSeconds: 60 },
  { id: 'calf-seduto', name: 'Calf raise seduto', aliases: 'seated calf raise', primaryMuscle: 'calves', equipment: 'machine', defaultRestSeconds: 60 },
  { id: 'calf-pressa', name: 'Calf raise alla pressa', primaryMuscle: 'calves', equipment: 'machine', defaultRestSeconds: 60 },
  { id: 'calf-multipower', name: 'Calf raise al multipower', primaryMuscle: 'calves', equipment: 'smith', defaultRestSeconds: 60 },
  { id: 'calf-corpo-libero', name: 'Calf raise a corpo libero', primaryMuscle: 'calves', equipment: 'bodyweight', trackingType: 'weighted_bodyweight', defaultRestSeconds: 45 },

  /* ──────────────────────────────────────────────────────────────── CORE ── */
  { id: 'crunch', name: 'Crunch a terra', primaryMuscle: 'abs', equipment: 'bodyweight', trackingType: 'weighted_bodyweight', defaultRestSeconds: 45 },
  { id: 'crunch-cavi', name: 'Crunch ai cavi', aliases: 'cable crunch', primaryMuscle: 'abs', equipment: 'cable', defaultRestSeconds: 60 },
  { id: 'crunch-macchina', name: 'Crunch alla macchina', primaryMuscle: 'abs', equipment: 'machine', defaultRestSeconds: 60 },
  { id: 'sit-up', name: 'Sit up', primaryMuscle: 'abs', secondaryMuscles: ['obliques'], equipment: 'bodyweight', trackingType: 'weighted_bodyweight', defaultRestSeconds: 45 },
  { id: 'leg-raise-terra', name: 'Sollevamento gambe a terra', aliases: 'leg raise', primaryMuscle: 'abs', equipment: 'bodyweight', trackingType: 'weighted_bodyweight', defaultRestSeconds: 45 },
  { id: 'leg-raise-sbarra', name: 'Sollevamento gambe alla sbarra', aliases: 'hanging leg raise', primaryMuscle: 'abs', secondaryMuscles: ['forearms'], equipment: 'bodyweight', trackingType: 'weighted_bodyweight', defaultRestSeconds: 75 },
  { id: 'ginocchia-al-petto-sbarra', name: 'Ginocchia al petto alla sbarra', aliases: 'hanging knee raise', primaryMuscle: 'abs', equipment: 'bodyweight', trackingType: 'weighted_bodyweight', defaultRestSeconds: 60 },
  { id: 'plank', name: 'Plank', primaryMuscle: 'abs', secondaryMuscles: ['obliques'], equipment: 'bodyweight', trackingType: 'duration', defaultRestSeconds: 60 },
  { id: 'plank-laterale', name: 'Plank laterale', aliases: 'side plank', primaryMuscle: 'obliques', secondaryMuscles: ['abs'], equipment: 'bodyweight', trackingType: 'duration', isUnilateral: true, defaultRestSeconds: 45 },
  { id: 'hollow-hold', name: 'Hollow hold', primaryMuscle: 'abs', equipment: 'bodyweight', trackingType: 'duration', defaultRestSeconds: 60 },
  { id: 'ab-wheel', name: 'Ab wheel', aliases: 'ruota addominali', primaryMuscle: 'abs', secondaryMuscles: ['lats'], equipment: 'other', defaultRestSeconds: 75 },
  { id: 'russian-twist', name: 'Russian twist', primaryMuscle: 'obliques', secondaryMuscles: ['abs'], equipment: 'plate', defaultRestSeconds: 45 },
  { id: 'woodchopper', name: 'Woodchopper ai cavi', aliases: 'torsioni ai cavi', primaryMuscle: 'obliques', secondaryMuscles: ['abs'], equipment: 'cable', isUnilateral: true, defaultRestSeconds: 45 },
  { id: 'pallof-press', name: 'Pallof press', primaryMuscle: 'obliques', secondaryMuscles: ['abs'], equipment: 'cable', isUnilateral: true, defaultRestSeconds: 45 },
  { id: 'dead-bug', name: 'Dead bug', primaryMuscle: 'abs', equipment: 'bodyweight', trackingType: 'bodyweight_reps', defaultRestSeconds: 45 },
  { id: 'mountain-climber', name: 'Mountain climber', primaryMuscle: 'abs', secondaryMuscles: ['obliques'], equipment: 'bodyweight', trackingType: 'duration', defaultRestSeconds: 45 },

  /* ────────────────────────────────────────────────────────────── CARDIO ── */
  { id: 'tapis-roulant', name: 'Tapis roulant', aliases: 'corsa;treadmill', primaryMuscle: 'cardio', equipment: 'machine', trackingType: 'distance_duration', defaultRestSeconds: 0 },
  { id: 'camminata-pendenza', name: 'Camminata in pendenza', aliases: 'incline walk', primaryMuscle: 'cardio', secondaryMuscles: ['glutes', 'calves'], equipment: 'machine', trackingType: 'distance_duration', defaultRestSeconds: 0 },
  { id: 'cyclette', name: 'Cyclette', aliases: 'bike;bicicletta', primaryMuscle: 'cardio', secondaryMuscles: ['quads'], equipment: 'machine', trackingType: 'distance_duration', defaultRestSeconds: 0 },
  { id: 'vogatore', name: 'Vogatore', aliases: 'rower;remoergometro', primaryMuscle: 'cardio', secondaryMuscles: ['lats', 'quads'], equipment: 'machine', trackingType: 'distance_duration', defaultRestSeconds: 0 },
  { id: 'ellittica', name: 'Ellittica', primaryMuscle: 'cardio', equipment: 'machine', trackingType: 'distance_duration', defaultRestSeconds: 0 },
  { id: 'stair-master', name: 'Stair master', aliases: 'scalinata', primaryMuscle: 'cardio', secondaryMuscles: ['glutes', 'quads'], equipment: 'machine', trackingType: 'duration', defaultRestSeconds: 0 },
  { id: 'corda', name: 'Corda', aliases: 'salto con la corda;jump rope', primaryMuscle: 'cardio', secondaryMuscles: ['calves'], equipment: 'other', trackingType: 'duration', defaultRestSeconds: 45 },
];
