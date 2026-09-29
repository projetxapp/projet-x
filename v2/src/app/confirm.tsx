import { PageHead } from '@/components/app/page-head';
import { ConfirmScreen } from '@/features/auth/confirm-screen';

export default function Confirm() {
  return (
    <>
      <PageHead title="Confirmation" noindex />
      <ConfirmScreen />
    </>
  );
}
