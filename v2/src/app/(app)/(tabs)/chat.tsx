import { PageHead } from '@/components/app/page-head';
import { ChatListScreen } from '@/features/chat/chat-list-screen';

export default function Chat() {
  return (
    <>
      <PageHead title="Messages" noindex />
      <ChatListScreen />
    </>
  );
}
