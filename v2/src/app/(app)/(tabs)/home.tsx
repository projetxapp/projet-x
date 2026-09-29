import { PageHead } from '@/components/app/page-head';
import { HomeScreen } from '@/features/home/home-screen';

export default function Home() {
  return (
    <>
      <PageHead title="Accueil" noindex />
      <HomeScreen />
    </>
  );
}
