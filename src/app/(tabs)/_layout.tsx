import { Tabs } from 'expo-router/js-tabs';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActiveSessionBar } from '@/components/active-session-bar';
import { TabBar } from '@/components/tab-bar';
import { BlurTargetProvider } from '@/components/ui/blur-target';
import { OuterChromeProvider } from '@/components/ui/screen';

/**
 * Il chrome delle tab sta *sopra* le schermate, non sotto.
 *
 * È la condizione perché il vetro sia vetro: la barra deve avere qualcosa da
 * sfocare, e quel qualcosa è il contenuto che le scorre sotto. Per questo
 * `<Tabs>` è avvolto in un `BlurTargetProvider` e la barra è un suo fratello
 * sovrapposto — mai un discendente, o dovrebbe sfocare sé stessa.
 *
 * Da qui viene anche il fatto che `TabBar` non riceva più le props del
 * navigatore: fuori da `<Tabs>` non arrivano, e la rotta attiva se la legge
 * dai segmenti del router.
 */
export default function TabsLayout() {
  // Misurato invece che calcolato: l'altezza cambia con l'area sicura del
  // telefono e con la presenza della barra dell'allenamento in corso.
  const [chromeHeight, setChromeHeight] = useState(0);

  return (
    <View style={styles.root}>
      <OuterChromeProvider height={chromeHeight}>
        <BlurTargetProvider style={styles.root}>
          <Tabs
            screenOptions={{ headerShown: false }}
            // La barra vera è fuori: qui serve solo che il navigatore non ne
            // disegni una propria e non riservi spazio in fondo.
            tabBar={() => null}>
            <Tabs.Screen name="index" options={{ title: 'Oggi' }} />
            <Tabs.Screen name="routines" options={{ title: 'Schede' }} />
            <Tabs.Screen name="exercises" options={{ title: 'Esercizi' }} />
            <Tabs.Screen name="history" options={{ title: 'Storico' }} />
            <Tabs.Screen name="stats" options={{ title: 'Statistiche' }} />
          </Tabs>
        </BlurTargetProvider>
      </OuterChromeProvider>

      <View
        style={styles.chrome}
        pointerEvents="box-none"
        onLayout={(e) => setChromeHeight(e.nativeEvent.layout.height)}>
        {/* La barra dell'allenamento in corso sta sopra le tab: da qualunque
            schermata si è a un tocco dalla sessione. */}
        <ActiveSessionBar />
        <TabBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  chrome: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
