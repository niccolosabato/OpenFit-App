// Import per singolo peso e non dalla radice del pacchetto: la radice
// riesporta tutti e diciotto i tagli di Inter, e Metro se li porta dentro il
// bundle tutti — sei megabyte di caratteri che nessuno usa.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk/500Medium';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import migrations from '../../drizzle/migrations';
import { BootErrorScreen, BootScreen } from '@/components/boot-screen';
import { bootstrapDatabase } from '@/db/bootstrap';
import { db } from '@/db/client';
import { ToastHost } from '@/components/ui/toast';
import { ConfirmHost } from '@/components/ui/confirm';
import { OnboardingFlow } from '@/features/onboarding/onboarding-flow';
import { SettingsProvider, useSettings } from '@/store/settings';
import { ThemeProvider } from '@/theme';
import { neutral } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Su alcuni avvii lo splash è già stato nascosto: non è un errore.
});

/**
 * Oltre questo tempo l'avvio è considerato bloccato.
 *
 * Le migrazioni su un database locale sono questione di millisecondi: se dopo
 * dieci secondi non hanno né funzionato né fallito, qualcosa si è piantato e
 * dirlo è meglio che lasciare girare lo splash all'infinito.
 */
const BOOT_TIMEOUT_MS = 10_000;

/**
 * Le rotte, oppure la presentazione al primo avvio.
 *
 * È un componente a parte perché `RootLayout` è quello che *monta*
 * `SettingsProvider`, e da lì non può leggerne il contenuto.
 *
 * La condizione è `isLoaded && !onboardingCompleted`, e il controllo su
 * `isLoaded` non è ridondante: finché la prima lettura dal database non arriva,
 * `settings` è il fallback scritto a mano nello store, che ha
 * `onboardingCompleted: false`. Senza quel controllo la presentazione
 * lampeggerebbe a ogni avvio anche a chi l'ha già fatta.
 *
 * Nessun `Redirect`: montare le tab e poi navigare via significherebbe uno
 * sfarfallio e un "indietro" che riporta dentro l'app da cui si è appena usciti.
 */
function AppRoutes() {
  const { settings, isLoaded } = useSettings();

  if (!isLoaded) return <BootScreen message="Carico il profilo…" />;

  if (!settings.onboardingCompleted) return <OnboardingFlow />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: neutral.bg },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="(tabs)" />
      {/* La sessione sale dal basso: è un contesto in cui si entra e da cui si
          esce, non una pagina della navigazione. */}
      <Stack.Screen
        name="session/active"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}

/**
 * I file dei caratteri.
 *
 * Le chiavi sono i nomi con cui i componenti li chiedono: devono restare
 * identici a `theme/tokens.ts → family`, o il testo esce con il carattere di
 * sistema senza che nulla segnali l'errore.
 */
const FONTS = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
};

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  // I caratteri si caricano in parallelo alle migrazioni: sono due attese
  // indipendenti, e metterle in fila raddoppierebbe l'avvio per niente.
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<Error | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  // Lo splash di sistema va via appena l'app monta, non a preparazione finita.
  // Da qui in poi comanda `BootScreen`, che ha lo stesso aspetto ma può dire
  // a che punto è — e soprattutto può mostrare un errore. Nasconderlo solo a
  // fine avvio significa che qualunque intoppo diventa uno splash eterno e
  // muto, indistinguibile da un'app che non parte.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (ready || error) return;
    const timeout = setTimeout(() => setTimedOut(true), BOOT_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [ready, error]);

  // Impostazioni di default e libreria esercizi: solo dopo che le tabelle
  // esistono, e una volta sola per avvio.
  useEffect(() => {
    if (!success || ready) return;
    try {
      bootstrapDatabase(db);
    } catch (e) {
      setBootError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setReady(true);
    }
  }, [success, ready]);

  const fatal =
    error ??
    bootError ??
    fontError ??
    (timedOut
      ? new Error(
          success
            ? 'Il caricamento della libreria esercizi non si è concluso.'
            : 'Le migrazioni del database non si sono concluse.',
        )
      : null);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: neutral.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {fatal ? (
          <BootErrorScreen error={fatal} />
        ) : !ready || !fontsLoaded ? (
          <BootScreen
            message={
              !success ? 'Preparo il database…' : !ready ? 'Carico la libreria esercizi…' : 'Ci siamo…'
            }
          />
        ) : (
          <SettingsProvider>
            <ThemeProvider>
              <AppRoutes />
              <ToastHost />
              <ConfirmHost />
            </ThemeProvider>
          </SettingsProvider>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
