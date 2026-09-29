import { PageHead } from '@/components/app/page-head';
import { BlockedScreen } from '@/features/social/blocked-screen';

export default function Bloques() {
  return (
    <>
      <PageHead title="Utilisateurs bloqués" noindex />
      <BlockedScreen />
    </>
  );
}
