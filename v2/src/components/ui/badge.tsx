import { View } from 'react-native';

import { Text } from './text';

/** Orange count bubble (notifications, unread). */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <View
      className={`min-w-[18px] items-center justify-center rounded-full border-2 border-bg bg-notif px-1 ${className ?? ''}`}
      style={{ height: 18 }}>
      <Text className="text-[10px] font-extrabold text-white">{count > 99 ? '99+' : count}</Text>
    </View>
  );
}
