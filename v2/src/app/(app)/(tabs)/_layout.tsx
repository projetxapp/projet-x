import { Tabs } from 'expo-router';

import { AppTabBar } from '@/components/app/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false, animation: 'none' }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="swipe" />
      <Tabs.Screen name="explorer" />
      <Tabs.Screen name="profil" />
    </Tabs>
  );
}
