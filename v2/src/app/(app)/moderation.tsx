import { PageHead } from '@/components/app/page-head';
import { ModerationScreen } from '@/features/admin/moderation-screen';

export default function Moderation() {
  return (
    <>
      <PageHead title="Modération" noindex />
      <ModerationScreen />
    </>
  );
}
