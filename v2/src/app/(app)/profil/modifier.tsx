import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { PageHead } from '@/components/app/page-head';
import { useMe } from '@/features/me/api';
import { EditProfileScreen } from '@/features/profile/edit/edit-profile-screen';
import type { EditSection } from '@/features/profile/edit/schema';

const SECTIONS: readonly EditSection[] = ['identity', 'talent', 'project', 'investor'];

export default function EditProfile() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const { data: me } = useMe();
  return (
    <>
      <PageHead title="Modifier mon profil" noindex />
      {me ? (
        // Remount when modes change (a newly activated mode gets fresh defaults).
        <EditProfileScreen
          key={me.modes.join(',')}
          me={me}
          initialSection={SECTIONS.find((s) => s === section)}
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-bg">
          <ActivityIndicator color="#6D28D9" />
        </View>
      )}
    </>
  );
}
