/**
 * Conferme e avvisi, con il tema dell'app.
 *
 * `Alert.alert` è di sistema: fondo bianco, angoli e pulsanti di Android, un
 * blocco estraneo in mezzo a un'app tutta carbone e accento. E arriva sempre
 * nei momenti che contano — "elimino la scheda?", "scarto l'allenamento?" —
 * dove uno stacco così fa sembrare che a rispondere sia un'altra applicazione.
 *
 * Ricalca il toast: uno store zustand più un host montato una volta sola nel
 * layout. Così si chiama anche da fuori React — `confirm({ … })` dentro una
 * funzione qualsiasi — esattamente come si faceva con `Alert`.
 */

import { create } from 'zustand';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { Button } from './button';
import { Surface } from './surface';
import { Text } from './text';

export type ConfirmAction = {
  label: string;
  onPress: () => void;
  /** Rossa: elimina, scarta, azzera. */
  destructive?: boolean;
};

export type ConfirmRequest = {
  title: string;
  /** Riga di spiegazione: cosa si perde, cosa succede dopo. */
  message?: string;
  /** Assente = è un avviso, non una domanda: un pulsante solo per chiuderlo. */
  action?: ConfirmAction;
  /** Una seconda strada, sotto la principale. */
  alternative?: ConfirmAction;
  cancelLabel?: string;
};

type ConfirmState = {
  request: ConfirmRequest | null;
  ask: (request: ConfirmRequest) => void;
  dismiss: () => void;
};

const useConfirmStore = create<ConfirmState>((set) => ({
  request: null,
  ask: (request) => set({ request }),
  dismiss: () => set({ request: null }),
}));

/** Chiede conferma. Si può chiamare anche fuori da un componente. */
export function confirm(request: ConfirmRequest): void {
  useConfirmStore.getState().ask(request);
}

/** Avvisa e basta: un pulsante solo, niente da decidere. */
export function notify(title: string, message?: string): void {
  useConfirmStore.getState().ask({ title, message });
}

export function ConfirmHost() {
  const theme = useTheme();
  const { request, dismiss } = useConfirmStore();

  const isQuestion = Boolean(request?.action);

  function run(action: ConfirmAction) {
    // Prima si chiude, poi si esegue: l'azione spesso naviga altrove, e il
    // dialogo non deve restare aperto sopra la schermata seguente.
    dismiss();
    action.onPress();
  }

  return (
    <Modal
      visible={request !== null}
      transparent
      animationType="fade"
      onRequestClose={dismiss}
      statusBarTranslucent>
      <View style={styles.fill}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.colors.scrim }]}
          onPress={dismiss}
          accessibilityLabel="Chiudi"
        />

        {/* Al centro, non in basso: un foglio si sfoglia, una domanda si
            guarda. Il distacco dai bordi è quello delle barre. */}
        <View
          style={[styles.center, { paddingHorizontal: theme.floatInset }]}
          pointerEvents="box-none">
          <Surface
            level="high"
            elevation="sheet"
            radius={theme.radius.xxl}
            style={{
              width: '100%',
              maxWidth: 420,
              padding: theme.space.xl,
              gap: theme.space.xl,
            }}>
            <View style={{ gap: theme.space.xs, alignItems: 'center' }}>
              <Text variant="heading" style={styles.centered}>
                {request?.title}
              </Text>
              {request?.message ? (
                <Text variant="caption" tone="dim" style={styles.centered}>
                  {request.message}
                </Text>
              ) : null}
            </View>

            {/* In colonna e non in riga: le etichette qui sono frasi
                ("Scarta e ricomincia"), non parole, e affiancate finirebbero
                spezzate su due righe. Annulla resta in fondo, in sordina. */}
            <View style={{ gap: theme.space.sm }}>
              {request?.action ? (
                <Button
                  title={request.action.label}
                  variant={request.action.destructive ? 'danger' : 'primary'}
                  size="lg"
                  fullWidth
                  onPress={() => run(request.action!)}
                />
              ) : null}
              {request?.alternative ? (
                <Button
                  title={request.alternative.label}
                  variant={request.alternative.destructive ? 'danger' : 'secondary'}
                  size="lg"
                  fullWidth
                  onPress={() => run(request.alternative!)}
                />
              ) : null}
              <Button
                title={isQuestion ? (request?.cancelLabel ?? 'Annulla') : 'Ho capito'}
                variant={isQuestion ? 'ghost' : 'primary'}
                size="lg"
                fullWidth
                onPress={dismiss}
              />
            </View>
          </Surface>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  center: { flex: 1, justifyContent: 'center' },
  centered: { textAlign: 'center' },
});
