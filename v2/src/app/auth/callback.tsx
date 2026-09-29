import { PageHead } from '@/components/app/page-head';
import { AuthCallbackScreen } from '@/features/auth/callback-screen';

export default function AuthCallback() {
  return (
    <>
      <PageHead title="Connexion" noindex />
      <AuthCallbackScreen />
    </>
  );
}
