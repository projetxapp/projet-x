import { CGU } from '@/features/legal/content';
import { LegalScreen } from '@/features/legal/legal-screen';

export default function Cgu() {
  return (
    <LegalScreen
      title="Conditions générales d'utilisation"
      description="Les règles d'utilisation de Projet X, la plateforme qui met en relation talents, porteurs de projet et investisseurs."
      sections={CGU}
    />
  );
}
