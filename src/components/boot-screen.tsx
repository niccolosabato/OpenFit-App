import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { ACCENTS, DEFAULT_ACCENT, neutral, space } from '@/theme/tokens';

/**
 * Schermata mostrata mentre girano migrazioni e seed.
 *
 * Non può usare `useTheme`: a questo punto il database — e quindi l'accento
 * scelto dall'utente — non è ancora leggibile. Usa i token grezzi.
 */
export function BootScreen({ message = 'Preparazione…' }: { message?: string }) {
  return (
    <View style={styles.root}>
      <ActivityIndicator color={ACCENTS[DEFAULT_ACCENT].base} size="large" />
      <Text variant="caption" tone="dim" style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

/**
 * Migrazione fallita: senza database l'app non può fare niente, quindi si dice
 * cosa è andato storto invece di mostrare schermate vuote.
 */
export function BootErrorScreen({ error }: { error: Error }) {
  return (
    <View style={styles.root}>
      <Text variant="title" tone="danger">
        Database non disponibile
      </Text>
      <Text variant="caption" tone="dim" style={styles.message}>
        Le migrazioni non sono andate a buon fine. Riavvia l’app; se il problema
        resta, reinstallala (i dati locali andranno persi).
      </Text>
      <Text variant="caption" tone="faint" style={styles.message}>
        {error.message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: neutral.bg,
    padding: space.xl,
    gap: space.md,
  },
  message: { textAlign: 'center' },
});
