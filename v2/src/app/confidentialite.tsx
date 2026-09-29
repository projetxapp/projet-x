import { PRIVACY } from '@/features/legal/content';
import { LegalScreen } from '@/features/legal/legal-screen';

export default function Confidentialite() {
  return (
    <LegalScreen
      title="Politique de confidentialité"
      description="Comment Projet X collecte, utilise et protège tes données personnelles (RGPD)."
      sections={PRIVACY}
    />
  );
}
