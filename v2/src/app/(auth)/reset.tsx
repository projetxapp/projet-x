import { ResetScreen } from '@/features/auth/reset-screen';
import { PageHead } from '@/components/app/page-head';

export default function Reset() {
  return (
    <>
      <PageHead title="Mot de passe oublié" noindex />
      <ResetScreen />
    </>
  );
}
