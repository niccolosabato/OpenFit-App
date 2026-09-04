/**
 * Salvataggio e ripristino del backup come file.
 *
 * Il file si scrive nella cache e si passa al foglio di condivisione: da lì
 * l'utente lo mette dove vuole (Drive, mail, cartella locale). Scriverlo
 * direttamente in Download richiederebbe permessi che per un'operazione
 * occasionale non valgono la richiesta.
 */

import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
  exportBackup,
  parseBackup,
  restoreBackup,
  summarize,
  type BackupSummary,
} from '@/db/queries/backup';

function fileName(): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `openfit-backup-${stamp}.json`;
}

/** Scrive il backup e apre il foglio di condivisione. */
export async function shareBackup(): Promise<void> {
  const backup = exportBackup();
  const file = new File(Paths.cache, fileName());

  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(backup));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('La condivisione non è disponibile su questo dispositivo.');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Backup di OpenFit',
    UTI: 'public.json',
  });
}

export type ImportResult = { cancelled: true } | { cancelled: false; summary: BackupSummary };

/**
 * Sceglie un file e ne ripristina il contenuto.
 *
 * `copyToCacheDirectory` serve: su Android il selettore restituisce un URI
 * `content://` che non è leggibile direttamente come file.
 */
export async function pickAndRestoreBackup(): Promise<ImportResult> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/json', '*/*'],
    copyToCacheDirectory: true,
  });

  if (picked.canceled || !picked.assets?.[0]) return { cancelled: true };

  const raw = await new File(picked.assets[0].uri).text();
  const backup = parseBackup(raw);

  restoreBackup(backup);

  return { cancelled: false, summary: summarize(backup) };
}
