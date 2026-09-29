import { PageHead } from '@/components/app/page-head';
import { NotificationsScreen } from '@/features/notifications/notifications-screen';

export default function Notifications() {
  return (
    <>
      <PageHead title="Notifications" noindex />
      <NotificationsScreen />
    </>
  );
}
