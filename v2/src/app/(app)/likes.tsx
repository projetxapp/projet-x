import { PageHead } from '@/components/app/page-head';
import { LikesScreen } from '@/features/social/likes-screen';

export default function Likes() {
  return (
    <>
      <PageHead title="Ils t'ont liké" noindex />
      <LikesScreen />
    </>
  );
}
