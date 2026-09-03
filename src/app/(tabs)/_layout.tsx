import { Tabs } from 'expo-router/js-tabs';
import { View } from 'react-native';

import { ActiveSessionBar } from '@/components/active-session-bar';
import { TabBar } from '@/components/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        // La barra dell'allenamento in corso sta sopra le tab: da qualunque
        // schermata si è a un tocco dalla sessione.
        <View>
          <ActiveSessionBar />
          <TabBar {...props} />
        </View>
      )}>
      <Tabs.Screen name="index" options={{ title: 'Oggi' }} />
      <Tabs.Screen name="routines" options={{ title: 'Schede' }} />
      <Tabs.Screen name="exercises" options={{ title: 'Esercizi' }} />
      <Tabs.Screen name="history" options={{ title: 'Storico' }} />
      <Tabs.Screen name="stats" options={{ title: 'Statistiche' }} />
    </Tabs>
  );
}
