import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ACCENTS, DEFAULT_ACCENT, font, neutral, space } from '@/theme/tokens';

/**
 * Schermata mostrata mentre girano migrazioni, seed e caricamento dei
 * caratteri.
 *
 * Non usa né `useTheme` né il `Text` dell'app: a questo punto il database — e
 * quindi l'accento scelto — non è ancora leggibile, e **i caratteri non sono
 * ancora caricati**. Chiedere qui `Inter_400Regular` significherebbe chiedere
 * un font che non esiste, e la sola schermata che deve funzionare sempre è
 * l'ultima su cui vale la pena rischiare. Testo di sistema, token grezzi.
 */
export function BootScreen({ message = 'Preparazione…' }: { message?: string }) {
  return (
    <View style={styles.root}>
      <ActivityIndicator color={ACCENTS[DEFAULT_ACCENT].base} size="large" />
      <Text style={[styles.body, styles.message]}>{message}</Text>
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
      <Text style={styles.title}>Database non disponibile</Text>
      <Text style={[styles.body, styles.message]}>
        Le migrazioni non sono andate a buon fine. Riavvia l’app; se il problema
        resta, reinstallala (i dati locali andranno persi).
      </Text>
      <Text style={[styles.body, styles.faint]}>{error.message}</Text>
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
  title: {
    color: neutral.text,
    fontSize: font.size.xxl,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: { color: neutral.textDim, fontSize: font.size.sm },
  message: { textAlign: 'center', maxWidth: 320 },
  faint: { color: neutral.textFaint, textAlign: 'center' },
});
