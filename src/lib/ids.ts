import * as Crypto from 'expo-crypto';

/**
 * Identificatore di una riga.
 *
 * UUID e non autoincrement: gli id finiscono nei backup JSON, quindi devono
 * restare validi anche reimportati su un altro dispositivo.
 */
export function newId(): string {
  return Crypto.randomUUID();
}
