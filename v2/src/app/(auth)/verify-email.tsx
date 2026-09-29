import { PageHead } from '@/components/app/page-head';
import { VerifyEmailScreen } from '@/features/auth/verify-email-screen';

export default function VerifyEmail() {
  return (
    <>
      <PageHead title="Vérifie ton email" noindex />
      <VerifyEmailScreen />
    </>
  );
}
