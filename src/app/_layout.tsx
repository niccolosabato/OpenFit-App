import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
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
import { SettingsProvider } from '@/store/settings';
import { ThemeProvider } from '@/theme';
import { neutral } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Su alcuni avvii lo splash è già stato nascosto: non è un errore.
});

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<Error | null>(null);

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

  useEffect(() => {
    if (ready || error) SplashScreen.hideAsync().catch(() => {});
  }, [ready, error]);

  const fatal = error ?? bootError;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: neutral.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {fatal ? (
          <BootErrorScreen error={fatal} />
        ) : !ready ? (
          <BootScreen message={success ? 'Carico la libreria esercizi…' : 'Preparo il database…'} />
        ) : (
          <SettingsProvider>
            <ThemeProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: neutral.bg },
                  animation: 'slide_from_right',
                }}>
                <Stack.Screen name="(tabs)" />
              </Stack>
            </ThemeProvider>
          </SettingsProvider>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
