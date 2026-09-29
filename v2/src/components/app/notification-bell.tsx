import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { View } from 'react-native';

import { CountBadge, IconButton } from '@/components/ui';
import { useMe } from '@/features/me/api';
import { useTheme } from '@/providers/theme-provider';

export function NotificationBell() {
  const router = useRouter();
  const { palette } = useTheme();
  const { data: me } = useMe();
  const count = me?.unread_notifications ?? 0;
  return (
    <View>
      <IconButton
        testID="notification-bell"
        accessibilityLabel={count > 0 ? `Notifications, ${count} non lues` : 'Notifications'}
        icon={<Bell size={19} color={palette.text} />}
        onPress={() => router.push('/notifications')}
      />
      <View className="absolute -right-1 -top-1" style={{ pointerEvents: 'none' }}>
        <CountBadge count={count} />
      </View>
    </View>
  );
}
