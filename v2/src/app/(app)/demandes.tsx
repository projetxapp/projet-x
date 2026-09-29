import { PageHead } from '@/components/app/page-head';
import { RequestsScreen } from '@/features/social/requests-screen';

export default function Demandes() {
  return (
    <>
      <PageHead title="Mises en relation" noindex />
      <RequestsScreen />
    </>
  );
}
