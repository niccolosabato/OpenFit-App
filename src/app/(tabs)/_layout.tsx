import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Oggi' }} />
      <Tabs.Screen name="routines" options={{ title: 'Schede' }} />
      <Tabs.Screen name="history" options={{ title: 'Storico' }} />
      <Tabs.Screen name="stats" options={{ title: 'Statistiche' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profilo' }} />
    </Tabs>
  );
}
