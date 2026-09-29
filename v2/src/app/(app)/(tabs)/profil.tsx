import { PageHead } from '@/components/app/page-head';
import { ProfileScreen } from '@/features/profile/profile-screen';

export default function Profil() {
  return (
    <>
      <PageHead title="Mon profil" noindex />
      <ProfileScreen />
    </>
  );
}
