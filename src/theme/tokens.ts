/**
 * Design tokens di OpenFit.
 *
 * Estetica: sala pesi. Fondo quasi nero, superfici carbone, bordi netti,
 * un solo accento saturo. Niente gradienti pastello, niente ombre morbide.
 * I colori non si scrivono mai a mano nei componenti: si passa da qui.
 */

/** Scala di grigi neutra, dal fondo alla superficie più alta. */
export const neutral = {
  /** Fondo dell'app. */
  bg: '#0B0B0D',
  /** Card e liste. */
  surface: '#141418',
  /** Elementi sopra una card (input, righe di set). */
  surface2: '#1C1C22',
  /** Stato premuto / selezionato. */
  surface3: '#26262F',
  /** Bordo standard, appena percettibile. */
  border: '#2A2A33',
  /** Bordo marcato: separa sezioni, incornicia gli input attivi. */
  borderStrong: '#3D3D49',
  /** Testo primario. */
  text: '#F4F4F6',
  /** Etichette, unità di misura, metadati. */
  textDim: '#9B9BA7',
  /** Placeholder e testo disabilitato. */
  textFaint: '#63636E',
  /** Testo su superficie accento. */
  onAccentDark: '#0B0B0D',
  /** Velo che oscura il contenuto dietro un foglio aperto. */
  scrim: 'rgba(0, 0, 0, 0.62)',
} as const;

/** Colori semantici, indipendenti dall'accento scelto dall'utente. */
export const semantic = {
  danger: '#FF4D4F',
  dangerDim: '#7A2326',
  warning: '#FFB020',
  success: '#3DDC84',
  /** Badge dei record personali. */
  record: '#FFC53D',
} as const;

export type AccentKey = 'volt' | 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose';

export type Accent = {
  /** Tinta piena: bottoni primari, valori attivi, tracce dei grafici. */
  base: string;
  /** Variante spenta: bordi, stati inattivi, linee secondarie. */
  dim: string;
  /** Testo/icone sopra `base`. */
  on: string;
  /** Velo traslucido per sfondi e aloni. */
  glow: string;
};

/**
 * Accenti selezionabili nel profilo. `on` è calcolato per restare leggibile
 * sopra `base`: le tinte chiare (volt, amber) vogliono testo scuro.
 */
export const ACCENTS: Record<AccentKey, Accent> = {
  volt: { base: '#C6F432', dim: '#7E9B21', on: '#0B0B0D', glow: 'rgba(198, 244, 50, 0.14)' },
  emerald: { base: '#10B981', dim: '#0B7355', on: '#04120C', glow: 'rgba(16, 185, 129, 0.14)' },
  cyan: { base: '#22D3EE', dim: '#0E7C8C', on: '#04141A', glow: 'rgba(34, 211, 238, 0.14)' },
  violet: { base: '#A78BFA', dim: '#6647B8', on: '#0B0620', glow: 'rgba(167, 139, 250, 0.14)' },
  amber: { base: '#FBBF24', dim: '#9A7314', on: '#150E00', glow: 'rgba(251, 191, 36, 0.14)' },
  rose: { base: '#FB7185', dim: '#9B3B49', on: '#1A0409', glow: 'rgba(251, 113, 133, 0.14)' },
};

export const ACCENT_LABELS: Record<AccentKey, string> = {
  volt: 'Volt',
  emerald: 'Smeraldo',
  cyan: 'Ciano',
  violet: 'Viola',
  amber: 'Ambra',
  rose: 'Rosa',
};

export const DEFAULT_ACCENT: AccentKey = 'volt';

/** Scala di spaziatura a passo 4. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/**
 * Raggi, per ruolo e non per gusto. Ogni elemento sceglie in base a cosa *è*,
 * così due cose che fanno la stessa cosa non finiscono con angoli diversi:
 *
 * - `pill`  ciò che si tocca ed è autonomo: bottoni, chip, bersagli icona
 * - `xl`    ciò che galleggia sopra il contenuto: barre, fogli, avvisi
 * - `lg`    le superfici nel flusso: card, sezioni, campi di testo
 * - `md`    i controlli dentro una card: celle, spunte
 * - `sm`    i segni minuti: tag, badge, quadratini di legenda
 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

/**
 * Ombre.
 *
 * Servono a una cosa sola: staccare dal fondo le barre che galleggiano sopra
 * il contenuto. Le superfici che stanno *nel* flusso — card, righe, input —
 * non le usano: lì la gerarchia resta quella dei bordi.
 *
 * `boxShadow` è per la resa (React Native 0.76+ con la New Architecture, che
 * questo progetto usa), `elevation` è la rete di sicurezza di Android.
 */
export const elevation = {
  none: {},
  /** Barra appoggiata: tab bar, barra delle azioni. */
  float: { boxShadow: '0px 6px 18px rgba(0, 0, 0, 0.45)', elevation: 8 },
  /** Foglio sopra tutto il resto. */
  sheet: { boxShadow: '0px 12px 28px rgba(0, 0, 0, 0.55)', elevation: 16 },
} as const;

export type ElevationKey = keyof typeof elevation;

/**
 * Quanto le barre flottanti stanno staccate dai bordi dello schermo.
 *
 * È lo stesso `space.lg` che gli scroll usano come margine orizzontale: barre
 * e contenuto devono allinearsi sullo stesso filo verticale, altrimenti si
 * vede che sono due sistemi diversi.
 */
export const FLOAT_INSET = space.lg;

/**
 * Altezza minima di un elemento toccabile.
 * L'app si usa con una mano, mani sudate, telefono appoggiato sulla panca:
 * non scendere sotto questa soglia per nulla che si tocchi durante una serie.
 */
export const HIT = 48;

export const font = {
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    display: 34,
    /** Countdown del recupero a tutto schermo. */
    timer: 64,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
  /** Interlinea comoda per i blocchi di testo lunghi (note, istruzioni). */
  lineHeight: {
    tight: 1.15,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

/**
 * Font a cifre di larghezza fissa. Le colonne peso/ripetizioni di una
 * sessione non devono ballare mentre si digita.
 */
export const MONO = 'monospace';
