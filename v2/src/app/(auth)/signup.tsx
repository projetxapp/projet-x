import { useRouter } from 'expo-router';

import { OnboardingFlow } from '@/features/onboarding/onboarding-flow';
import { PageHead } from '@/components/app/page-head';

export default function Signup() {
  const router = useRouter();
  return (
    <>
      <PageHead
        title="Créer mon profil"
        description="Crée ton profil gratuitement : talent, porteur de projet ou investisseur."
      />
      <OnboardingFlow
        variant="signup"
        onExit={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
    </>
  );
}
