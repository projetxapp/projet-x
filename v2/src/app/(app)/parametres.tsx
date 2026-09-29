import { PageHead } from '@/components/app/page-head';
import { SettingsScreen } from '@/features/settings/settings-screen';

export default function Parametres() {
  return (
    <>
      <PageHead title="Paramètres" noindex />
      <SettingsScreen />
    </>
  );
}
