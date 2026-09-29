import { useLocalSearchParams } from 'expo-router';

import { PageHead } from '@/components/app/page-head';
import { ConversationScreen } from '@/features/chat/conversation-screen';

export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <PageHead title="Conversation" noindex />
      <ConversationScreen key={id} matchId={id} />
    </>
  );
}
