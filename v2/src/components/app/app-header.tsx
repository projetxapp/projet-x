import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Logo, Text } from '@/components/ui';
import { MODES } from '@/constants/modes';
import { useActiveMode } from '@/features/me/api';

import { ModeSelector } from './mode-selector';
import { NotificationBell } from './notification-bell';

type Props = { title?: string; right?: ReactNode; showModes?: boolean };

/** Header of every main tab: logo (mode gradient), bell with badge, mode selector. */
export function AppHeader({ title, right, showModes = true }: Props) {
  const { mode } = useActiveMode();
  return (
    <View className="gap-3.5 px-5 pb-3 pt-2">
      <View className="flex-row items-center justify-between">
        {title ? <Text variant="title">{title}</Text> : <Logo colors={MODES[mode].gradient} />}
        <View className="flex-row items-center gap-2">
          {right}
          <NotificationBell />
        </View>
      </View>
      {showModes ? <ModeSelector /> : null}
    </View>
  );
}
