import { PageHead } from '@/components/app/page-head';
import { ExplorerScreen } from '@/features/explorer/explorer-screen';

export default function Explorer() {
  return (
    <>
      <PageHead title="Explorer" noindex />
      <ExplorerScreen />
    </>
  );
}
