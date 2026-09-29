import { LoginScreen } from '@/features/auth/login-screen';
import { PageHead } from '@/components/app/page-head';

export default function Login() {
  return (
    <>
      <PageHead
        title="Connexion"
        description="Connecte-toi à Projet X, le Tinder de l'entrepreneuriat."
      />
      <LoginScreen />
    </>
  );
}
