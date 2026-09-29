import { useLocalSearchParams } from 'expo-router';

import { isMode } from '@/constants/modes';
import { PublicProfileScreen } from '@/features/profile/public-profile-screen';

/** Public profile (readable signed out: shareable link). */
export default function PublicProfile() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  return <PublicProfileScreen key={id} userId={id} initialMode={isMode(mode) ? mode : undefined} />;
}
