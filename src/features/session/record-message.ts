import { PR_TYPE_LABELS } from '@/db/enums';
import type { WeightUnit } from '@/db/enums';
import { formatWeight } from '@/lib/units';
import type { RecordHit } from '@/features/stats/records';

/**
 * Il testo del record da mostrare quando si spunta una serie.
 *
 * Con più primati insieme (capita: carico massimo *e* massimale stimato) si
 * annuncia il più significativo e si conta il resto, invece di impilare tre
 * avvisi uno sull'altro.
 */
export function describeRecordHits(
  hits: RecordHit[],
  unit: WeightUnit,
): { title: string; detail: string } | null {
  if (hits.length === 0) return null;

  // Ordine di importanza: un carico massimo dice più di un e1RM stimato.
  const priority: RecordHit['type'][] = ['best_weight', 'rep_max', 'best_e1rm', 'best_session_volume'];
  const main = [...hits].sort((a, b) => priority.indexOf(a.type) - priority.indexOf(b.type))[0];

  const label =
    main.type === 'rep_max'
      ? `Record a ${main.reps} ${main.reps === 1 ? 'ripetizione' : 'ripetizioni'}`
      : PR_TYPE_LABELS[main.type];

  const parts = [formatWeight(main.value, unit)];
  if (main.previous !== null) {
    const delta = main.value - main.previous;
    parts.push(`+${formatWeight(delta, unit)} sul precedente`);
  } else {
    parts.push('primo record su questo esercizio');
  }
  if (hits.length > 1) {
    parts.push(`e altri ${hits.length - 1}`);
  }

  return { title: label, detail: parts.join(' · ') };
}
