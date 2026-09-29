import type { Tabs } from 'expo-router';
import { Compass, Flame, Home, MessageCircle, User } from 'lucide-react-native';
import type { ComponentProps, ComponentType } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CountBadge, Gradient, Text } from '@/components/ui';
import { MODES } from '@/constants/modes';
import { useActiveMode, useMe } from '@/features/me/api';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/providers/theme-provider';
import { modeTextColor } from '@/theme/palette';

type IconProps = { size?: number; color?: string; strokeWidth?: number; fill?: string };

/** Props Expo Router passes to a custom tab bar. */
export type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; Icon: ComponentType<IconProps> }> = {
  home: { label: 'Accueil', Icon: Home },
  chat: { label: 'Chat', Icon: MessageCircle },
  swipe: { label: 'Swipe', Icon: Flame },
  explorer: { label: 'Explorer', Icon: Compass },
  profil: { label: 'Profil', Icon: User },
};

/** Accueil · Chat · Swipe (big central button) · Explorer · Profil. */
export function AppTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { palette, scheme } = useTheme();
  const { mode } = useActiveMode();
  const { data: me } = useMe();
  const accent = modeTextColor(mode, scheme);

  return (
    <View
      className="border-t border-line/10 bg-card"
      style={{ paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 10 : 8) }}>
      <View className="w-full max-w-[560px] flex-row items-end self-center px-2 pt-2">
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === index;
          const onPress = () => {
            haptics.selection();
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          if (route.name === 'swipe') {
            return (
              <Pressable
                key={route.key}
                testID="tab-swipe"
                accessibilityRole="tab"
                accessibilityLabel="Swipe"
                accessibilityState={{ selected: focused }}
                onPress={onPress}
                className="flex-1 items-center"
                style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.92 : 1 }] })}>
                <Gradient
                  colors={MODES[mode].gradient}
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 22,
                    marginTop: -22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0px 10px 26px ${MODES[mode].color}73`,
                  }}>
                  <Flame size={26} color="#FFFFFF" fill={focused ? '#FFFFFF' : 'transparent'} />
                </Gradient>
                <Text
                  className="mt-1 text-[11px] font-bold"
                  style={{ color: focused ? accent : palette.hint }}>
                  Swipe
                </Text>
              </Pressable>
            );
          }

          const badge = route.name === 'chat' ? (me?.unread_messages ?? 0) : 0;
          return (
            <Pressable
              key={route.key}
              testID={`tab-${route.name}`}
              accessibilityRole="tab"
              accessibilityLabel={badge > 0 ? `${tab.label}, ${badge} messages non lus` : tab.label}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              className="flex-1 items-center gap-1 py-1">
              <View>
                <tab.Icon
                  size={22}
                  color={focused ? accent : palette.hint}
                  strokeWidth={focused ? 2.4 : 1.8}
                />
                <View className="absolute -right-2.5 -top-1.5" style={{ pointerEvents: 'none' }}>
                  <CountBadge count={badge} />
                </View>
              </View>
              <Text
                className="text-[11px] font-semibold"
                style={{ color: focused ? accent : palette.hint }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
