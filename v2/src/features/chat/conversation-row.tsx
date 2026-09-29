import { Check, CheckCheck } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar, CountBadge, Text } from '@/components/ui';
import { MODES } from '@/constants/modes';
import { activityLabel, chatTime, fullName } from '@/lib/format';
import { useTheme } from '@/providers/theme-provider';
import type { Conversation } from '@/types/app';

export function conversationTitle(c: Conversation): string {
  return fullName(c.other_first_name, c.other_last_name);
}

export function conversationPreview(c: Conversation, myId: string | undefined): string {
  if (!c.last_message_id) {
    const other = MODES[c.other_mode];
    return c.source === 'contact'
      ? '🤝 Mise en relation acceptée — dis bonjour !'
      : `${other.emoji} Nouveau match — lance la conversation !`;
  }
  const mine = c.last_message_sender_id === myId;
  const body =
    c.last_message_type === 'image'
      ? '📷 Photo'
      : c.last_message_type === 'file'
        ? '📎 Fichier'
        : c.last_message_type === 'mission'
          ? `💼 Mission : ${c.last_message_content ?? ''}`
          : (c.last_message_content ?? '');
  return mine && c.last_message_type !== 'system' ? `Toi : ${body}` : body;
}

type Props = {
  conversation: Conversation;
  myId: string | undefined;
  onPress: (c: Conversation) => void;
};

export const ConversationRow = memo(function ConversationRow({
  conversation: c,
  myId,
  onPress,
}: Props) {
  const { palette } = useTheme();
  const other = MODES[c.other_mode];
  const unread = c.unread_count > 0;
  const mine = c.last_message_sender_id === myId;
  const online = activityLabel(c.other_last_active_at) === 'En ligne';
  const subtitle =
    c.other_mode === 'project' && c.other_project_name
      ? c.other_project_name
      : c.other_statut || other.label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conversation avec ${conversationTitle(c)}${unread ? `, ${c.unread_count} non lus` : ''}`}
      onPress={() => onPress(c)}
      className="flex-row items-center gap-3 px-5 py-3 active:bg-surface">
      <Avatar
        uri={c.other_avatar_url}
        firstName={c.other_first_name}
        lastName={c.other_last_name}
        size={52}
        gradient={other.gradient}
        online={online}
      />
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text
            className={`flex-1 text-[16px] text-text ${unread ? 'font-extrabold' : 'font-semibold'}`}
            numberOfLines={1}>
            {conversationTitle(c)}
          </Text>
          <Text className={`text-[12px] ${unread ? 'font-bold text-notif' : 'text-hint'}`}>
            {chatTime(c.last_message_created_at ?? c.created_at)}
          </Text>
        </View>
        <Text variant="caption" numberOfLines={1}>
          {other.emoji} {subtitle}
        </Text>
        <View className="flex-row items-center gap-1.5">
          {mine && c.last_message_type !== 'system' ? (
            c.last_message_seen ? (
              <CheckCheck size={14} color="#38BDF8" accessibilityLabel="Lu" />
            ) : (
              <Check size={14} color={palette.hint} accessibilityLabel="Envoyé" />
            )
          ) : null}
          <Text
            className={`flex-1 text-[14px] ${unread ? 'font-semibold text-text' : 'text-muted'}`}
            numberOfLines={1}>
            {conversationPreview(c, myId)}
          </Text>
          {unread ? <CountBadge count={c.unread_count} /> : null}
        </View>
      </View>
    </Pressable>
  );
});
