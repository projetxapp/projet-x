import { WelcomeScreen } from '@/features/auth/welcome-screen';
import { PageHead } from '@/components/app/page-head';

export default function Welcome() {
  return (
    <>
      <PageHead title="Bienvenue" noindex />
      <WelcomeScreen />
    </>
  );
}
