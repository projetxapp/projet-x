import { PageHead } from '@/components/app/page-head';
import { UpdatePasswordScreen } from '@/features/auth/update-password-screen';

export default function UpdatePassword() {
  return (
    <>
      <PageHead title="Nouveau mot de passe" noindex />
      <UpdatePasswordScreen />
    </>
  );
}
