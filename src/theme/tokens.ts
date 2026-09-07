/**
 * Design token di OpenFit.
 *
 * Estetica: sala pesi di notte. Fondo quasi nero, superfici che si alzano per
 * tono e non per bordo, un solo accento saturo usato come luce. Niente
 * decorazione: ogni token esiste perché qualcosa nell'app lo chiede.
 *
 * I colori non si scrivono mai a mano nei componenti: si passa da `useTheme()`.
 */

/**
 * Scala di grigi, dal fondo alla superficie più alta.
 *
 * È una scala **tonale**: ogni gradino è abbastanza più chiaro del precedente
 * da leggersi senza bisogno di un bordo. I bordi restano, ma come rifinitura —
 * un filo appena percettibile che definisce lo spigolo — non come il modo in
 * cui si capisce dove finisce una card. Era il contrario, e con dieci card di
 * fila l'effetto era una griglia di rettangoli tutti uguali.
 */
export const neutral = {
  /** Fondo dell'app. Più scuro delle superfici di quanto fosse: è ciò che
   *  permette alle card di sembrare appoggiate invece che incollate. */
  bg: '#08080B',
  /** Fondo di una schermata che ospita un pannello a tutta pagina (fogli). */
  bgDeep: '#050507',
  /** Card, liste, barre: il primo gradino sopra il fondo. */
  surface: '#131318',
  /** Ciò che sta dentro una card: input, righe di serie, pillole. */
  surface2: '#1D1D24',
  /** Terzo gradino: premuto, selezionato, pannelli dei fogli. */
  surface3: '#282831',
  /** Quarto: un controllo dentro un foglio. Raro, ma senza di lui i fogli
   *  hanno un gradino in meno del resto dell'app. */
  surface4: '#34343F',
  /** Bordo standard: rifinisce lo spigolo, non porta gerarchia. */
  border: '#24242C',
  /** Bordo marcato: separatori, campo a fuoco, contorno di un bottone. */
  borderStrong: '#3A3A46',
  /** Testo primario. */
  text: '#F6F6F8',
  /** Etichette, unità di misura, metadati. */
  textDim: '#9E9EAC',
  /** Placeholder, testo disabilitato, assi dei grafici. */
  textFaint: '#61616E',
  /** Testo su superficie accento. */
  onAccentDark: '#08080B',
  /** Velo che oscura il contenuto dietro un foglio aperto. */
  scrim: 'rgba(3, 3, 5, 0.72)',
} as const;

/** Colori semantici, indipendenti dall'accento scelto dall'utente. */
export const semantic = {
  danger: '#FF5A5F',
  /** Fondo di una superficie distruttiva: rosso spentissimo, non rosso acceso. */
  dangerDim: '#2E1416',
  /** Bordo di una superficie distruttiva. */
  dangerEdge: '#6B2429',
  warning: '#FFB020',
  success: '#3DDC84',
  /** Badge dei record personali. */
  record: '#FFC53D',
} as const;

/**
 * Le tinte selezionabili, in ordine di tonalità.
 *
 * L'ordine non è un dettaglio: è quello in cui compaiono nel profilo e nella
 * presentazione, e girando la ruota — verde acido, verde, ciano, blu, viola,
 * fucsia, rosa, ambra — le due file da quattro si leggono come uno spettro
 * invece che come otto colori messi in fila a caso.
 */
export type AccentKey =
  | 'volt'
  | 'emerald'
  | 'cyan'
  | 'blue'
  | 'violet'
  | 'fuchsia'
  | 'rose'
  | 'amber';

export type Accent = {
  /** Tinta piena: bottoni primari, valori attivi, tracce dei grafici. */
  base: string;
  /** Variante spenta: bordi, stati inattivi, linee secondarie. */
  dim: string;
  /** Testo/icone sopra `base`. */
  on: string;
  /** Velo traslucido: fondi selezionati, aloni. */
  glow: string;
  /** Velo più denso: bordo di ciò che è selezionato, riempimenti dei grafici. */
  edge: string;
  /** Alone ampio e quasi invisibile: la luce dietro un numero grande. */
  halo: string;
};

/**
 * Le otto tinte. `on` è la versione quasi nera della stessa tonalità: sopra
 * `base` resta leggibile, e un testo scuro intonato al colore che lo porta è
 * l'unico modo di non far sembrare il bottone primario un'etichetta incollata
 * sopra.
 *
 * Otto e non sei perché è il numero che riempie due righe da quattro: con sei
 * la seconda riga ne teneva due e la griglia sembrava interrotta a metà.
 */
export const ACCENTS: Record<AccentKey, Accent> = {
  volt: {
    base: '#C9F53A',
    dim: '#7E9B21',
    on: '#0A0F00',
    glow: 'rgba(201, 245, 58, 0.14)',
    edge: 'rgba(201, 245, 58, 0.34)',
    halo: 'rgba(201, 245, 58, 0.07)',
  },
  emerald: {
    base: '#22D08A',
    dim: '#0F7A55',
    on: '#02120B',
    glow: 'rgba(34, 208, 138, 0.14)',
    edge: 'rgba(34, 208, 138, 0.34)',
    halo: 'rgba(34, 208, 138, 0.07)',
  },
  cyan: {
    base: '#3ADBF0',
    dim: '#0E7C8C',
    on: '#02141A',
    glow: 'rgba(58, 219, 240, 0.14)',
    edge: 'rgba(58, 219, 240, 0.34)',
    halo: 'rgba(58, 219, 240, 0.07)',
  },
  blue: {
    base: '#60A5FA',
    dim: '#2A5FA8',
    on: '#03091A',
    glow: 'rgba(96, 165, 250, 0.16)',
    edge: 'rgba(96, 165, 250, 0.36)',
    halo: 'rgba(96, 165, 250, 0.08)',
  },
  violet: {
    base: '#AE93FF',
    dim: '#6647B8',
    on: '#0A0520',
    glow: 'rgba(174, 147, 255, 0.16)',
    edge: 'rgba(174, 147, 255, 0.36)',
    halo: 'rgba(174, 147, 255, 0.08)',
  },
  fuchsia: {
    base: '#E879F9',
    dim: '#8C3F99',
    on: '#180320',
    glow: 'rgba(232, 121, 249, 0.15)',
    edge: 'rgba(232, 121, 249, 0.35)',
    halo: 'rgba(232, 121, 249, 0.08)',
  },
  rose: {
    base: '#FF7A90',
    dim: '#9B3B49',
    on: '#180308',
    glow: 'rgba(255, 122, 144, 0.15)',
    edge: 'rgba(255, 122, 144, 0.35)',
    halo: 'rgba(255, 122, 144, 0.08)',
  },
  amber: {
    base: '#FFC43D',
    dim: '#9A7314',
    on: '#140C00',
    glow: 'rgba(255, 196, 61, 0.14)',
    edge: 'rgba(255, 196, 61, 0.34)',
    halo: 'rgba(255, 196, 61, 0.07)',
  },
};

export const ACCENT_LABELS: Record<AccentKey, string> = {
  volt: 'Volt',
  emerald: 'Smeraldo',
  cyan: 'Ciano',
  blue: 'Blu',
  violet: 'Viola',
  fuchsia: 'Fucsia',
  rose: 'Rosa',
  amber: 'Ambra',
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
 * - `xxl`  i pannelli che occupano un bordo dello schermo: fogli, barre
 * - `xl`   ciò che galleggia sopra il contenuto: header, avvisi, dialoghi
 * - `lg`   le superfici nel flusso: card, sezioni
 * - `md`   i controlli dentro una card: celle, spunte, campi
 * - `sm`   i segni minuti: tag, badge, quadratini di legenda
 *
 * Per le capsule — bottoni, chip, bersagli icona — non c'è un valore: si usa
 * `capsule(altezza)`, che il raggio se lo calcola.
 */
export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 26,
  xxl: 32,
} as const;

/**
 * Ombre.
 *
 * Servono a una cosa sola: staccare dal fondo ciò che galleggia sopra il
 * contenuto. Le superfici che stanno *nel* flusso — card, righe, input — non
 * le usano: lì la gerarchia è quella tonale.
 *
 * `boxShadow` è per la resa (React Native 0.76+ con la New Architecture, che
 * questo progetto usa), `elevation` è la rete di sicurezza di Android.
 */
export const elevation = {
  none: {},
  /** Card che vuole staccarsi appena: la card principale di una schermata. */
  raised: { boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.35)', elevation: 3 },
  /** Barra appoggiata: tab bar, barra delle azioni, header. */
  float: { boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.5)', elevation: 10 },
  /** Foglio sopra tutto il resto. */
  sheet: { boxShadow: '0px 16px 40px rgba(0, 0, 0, 0.62)', elevation: 20 },
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
 * Raggio di una capsula, data l'altezza dell'elemento.
 *
 * Va usato al posto di un `radius.pill` ogni volta che l'altezza si conosce.
 * Un raggio enorme si affida al ritaglio automatico a metà altezza, e su
 * Android quel ritaglio non è affidabile: viene fuori un rettangolo appena
 * smussato invece di una capsula, e nella stessa schermata finiscono forme
 * diverse per elementi che dovrebbero essere identici.
 */
export function capsule(height: number): number {
  return height / 2;
}

/**
 * Altezza minima di un elemento toccabile.
 * L'app si usa con una mano, mani sudate, telefono appoggiato sulla panca:
 * non scendere sotto questa soglia per nulla che si tocchi durante una serie.
 */
export const HIT = 48;

/**
 * Le famiglie.
 *
 * Due, con una divisione di lavoro netta:
 *
 * - **Inter** per tutto ciò che si legge come testo — nomi, etichette,
 *   descrizioni, e le colonne numeriche delle serie, dove servono le cifre a
 *   larghezza fissa che Inter ha e la maggior parte dei font di sistema no.
 * - **Space Grotesk** per i numeri che *sono* il contenuto: il countdown del
 *   recupero, il volume di una seduta, i contatori delle statistiche. Ha cifre
 *   larghe e squadrate che a corpo grande reggono lo sguardo da un metro di
 *   distanza — che è esattamente la distanza da cui si guarda il telefono
 *   appoggiato sulla panca.
 *
 * Le costanti sono i nomi con cui `expo-font` le registra in `_layout.tsx`:
 * se cambiano lì vanno cambiate qui, e viceversa.
 */
export const family = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  /** Titoli e numeri grandi. */
  display: 'SpaceGrotesk_500Medium',
  displayBold: 'SpaceGrotesk_700Bold',
} as const;

export const font = {
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 34,
    display: 44,
    /** Countdown del recupero a tutto schermo. */
    timer: 68,
  },
  /**
   * Il peso non basta più a dire quale font si sta usando: con famiglie
   * separate per peso, `fontWeight` su Android non sceglie il file giusto — lo
   * *simula*, ingrassando i contorni. Il peso resta come dichiarazione di
   * intento (e per il web), ma è `family` a comandare.
   */
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
  /**
   * Crenatura per corpo.
   *
   * A corpo grande le lettere vanno strette, altrimenti un titolo sembra
   * spaziato a mano; a corpo minuscolo vanno larghe, o le maiuscolette si
   * impastano. È la regola che separa un'app composta da una scritta e basta.
   */
  tracking: {
    display: -1.4,
    title: -0.8,
    heading: -0.3,
    body: 0,
    label: 0.9,
  },
  /** Interlinea comoda per i blocchi di testo lunghi (note, istruzioni). */
  lineHeight: {
    tight: 1.15,
    normal: 1.45,
    relaxed: 1.6,
  },
} as const;

/**
 * Movimento.
 *
 * Una molla sola per le trasformazioni (pressioni, pastiglie che scivolano,
 * card che entrano) e due durate per le dissolvenze. Avere un vocabolario
 * unico è ciò che fa sembrare l'app una cosa sola invece di venti animazioni
 * scritte in momenti diversi.
 */
export const motion = {
  /** Molla standard: risponde subito, si ferma senza rimbalzare. */
  spring: { damping: 20, stiffness: 260, mass: 0.7 },
  /** Molla più morbida: entrate ed elementi grandi. */
  springSoft: { damping: 22, stiffness: 160, mass: 0.9 },
  duration: {
    /** Feedback immediato: opacità di una pressione. */
    fast: 110,
    /** Dissolvenze e cambi di stato. */
    normal: 200,
    /** Entrate ed uscite di pannelli. */
    slow: 320,
  },
  /** Scala di un bersaglio premuto. */
  pressScale: 0.97,
} as const;

/**
 * Font a cifre di larghezza fissa.
 *
 * Resta il nome generico come rete di sicurezza per il web e per il caso in
 * cui i font non si carichino: nell'app le cifre tabellari le dà Inter con
 * `fontVariant: ['tabular-nums']`, e questa costante non si usa più a mano.
 */
export const MONO = 'monospace';
