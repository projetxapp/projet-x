import { FlashList } from '@shopify/flash-list';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Ban, Briefcase, Flag, MoreVertical, UserRound } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  Avatar,
  Chip,
  EmptyState,
  IconButton,
  ListRow,
  Screen,
  Sheet,
  Text,
  useToast,
} from '@/components/ui';
import { MODES } from '@/constants/modes';
import { FIRST_MESSAGE_SUGGESTIONS } from '@/constants/profile-options';
import { useBlockUser } from '@/features/social/api';
import { ReportSheet } from '@/features/social/report-sheet';
import { activeConversation } from '@/lib/active-conversation';
import { confirm } from '@/lib/confirm';
import { humanError } from '@/lib/errors';
import { activityLabel, dayLabel } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { compressImage, pickImage, PermissionDeniedError } from '@/lib/images';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';

import {
  messagesKey,
  newMessageId,
  useConversations,
  useMarkConversationRead,
  useMessages,
  useMissions,
  useSendMessage,
  type ChatMessage,
} from './api';
import { Composer } from './composer';
import { conversationTitle } from './conversation-row';
import { MessageBubble } from './message-bubble';
import { ProposeMissionSheet } from './propose-mission-sheet';
import { useConversationPresence } from './use-conversation-presence';

type Item =
  | { type: 'day'; key: string; label: string }
  | { type: 'message'; key: string; message: ChatMessage; tail: boolean };

const FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'image/*',
];
const MAX_FILE = 20 * 1024 * 1024;
// react-native-keyboard-controller ignores `style` on web (no keyboard to avoid there anyway).
const Avoider = Platform.OS === 'web' ? View : KeyboardAvoidingView;
const GROUP_GAP = 5 * 60_000;

function buildItems(messages: ChatMessage[]): Item[] {
  const items: Item[] = [];
  let lastDay = '';
  messages.forEach((message, i) => {
    const day = new Date(message.created_at).toDateString();
    if (day !== lastDay) {
      items.push({ type: 'day', key: `day-${day}`, label: dayLabel(message.created_at) });
      lastDay = day;
    }
    const next = messages[i + 1];
    const tail =
      !next ||
      next.sender_id !== message.sender_id ||
      next.type === 'system' ||
      new Date(next.created_at).getTime() - new Date(message.created_at).getTime() > GROUP_GAP ||
      new Date(next.created_at).toDateString() !== day;
    items.push({ type: 'message', key: message.id, message, tail });
  });
  return items;
}

export function ConversationScreen({ matchId }: { matchId: string }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const myId = user?.id;
  const { palette } = useTheme();
  const conversations = useConversations();
  const conversation = conversations.data?.find((c) => c.match_id === matchId);
  const messages = useMessages(matchId);
  const missions = useMissions(matchId);
  const send = useSendMessage(matchId);
  const markRead = useMarkConversationRead();
  const block = useBlockUser();
  const presence = useConversationPresence(matchId, myId);
  const [menu, setMenu] = useState(false);
  const [attachMenu, setAttachMenu] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [reporting, setReporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      activeConversation.set(matchId);
      return () => activeConversation.set(null);
    }, [matchId]),
  );

  const chronological = useMemo(
    () => (messages.data ? messages.data.pages.flat().slice().reverse() : []),
    [messages.data],
  );
  const items = useMemo(() => buildItems(chronological), [chronological]);
  const missionById = useMemo(
    () => new Map((missions.data ?? []).map((m) => [m.id, m])),
    [missions.data],
  );

  // Read receipts: mark incoming messages as read while the conversation is open.
  const hasUnseen = chronological.some((m) => m.sender_id !== myId && !m.seen);
  const { mutate: markConversationRead } = markRead;
  useEffect(() => {
    if (!hasUnseen || !myId) return;
    markConversationRead(matchId, {
      onSuccess: () =>
        queryClient.setQueryData<InfiniteData<ChatMessage[], string | null>>(
          messagesKey(matchId),
          (data) =>
            data
              ? {
                  ...data,
                  pages: data.pages.map((page) =>
                    page.map((m) => (m.sender_id !== myId ? { ...m, seen: true } : m)),
                  ),
                }
              : data,
        ),
    });
  }, [hasUnseen, matchId, myId, markConversationRead, queryClient]);

  // Mission messages refresh the missions list.
  const missionMessages = chronological.filter(
    (m) => m.type === 'mission' || m.type === 'system',
  ).length;
  const { refetch: refetchMissions } = missions;
  useEffect(() => {
    if (missionMessages > 0) void refetchMissions();
  }, [missionMessages, refetchMissions]);

  const myMode = conversation?.my_mode ?? 'talent';
  const otherMode = conversation?.other_mode ?? 'project';
  const color = MODES[myMode].color;
  const name = conversation ? conversationTitle(conversation) : '';
  const status = presence.otherTyping
    ? 'écrit…'
    : presence.otherHere
      ? 'Dans la conversation'
      : (activityLabel(conversation?.other_last_active_at) ??
        (otherMode === 'project' && conversation?.other_project_name
          ? `${MODES.project.emoji} ${conversation.other_project_name}`
          : `${MODES[otherMode].emoji} ${conversation?.other_statut || MODES[otherMode].label}`));

  const sendText = (text: string) => {
    const content = text.trim();
    if (!content) return;
    haptics.light();
    presence.setTyping(false);
    send.mutate(
      { id: newMessageId(), content },
      { onError: (error) => toast.show({ title: humanError(error), tone: 'error' }) },
    );
  };

  const retry = (message: ChatMessage) => {
    const attachment =
      message.localUri && (message.type === 'image' || message.type === 'file')
        ? {
            kind: message.type as 'image' | 'file',
            uri: message.localUri,
            name: message.attachment_name ?? 'fichier',
            mimeType: message.attachment_mime ?? 'application/octet-stream',
            size: message.attachment_size ?? 0,
          }
        : undefined;
    send.mutate({ id: message.id, content: message.content, attachment });
  };

  const sendPhoto = async () => {
    setAttachMenu(false);
    try {
      const picked = await pickImage({ edit: false });
      if (!picked) return;
      const image = await compressImage(picked, 1600);
      send.mutate(
        {
          id: newMessageId(),
          content: '',
          attachment: {
            kind: 'image',
            uri: image.uri,
            name: `photo-${Date.now()}.webp`,
            mimeType: 'image/webp',
            size: 0,
          },
        },
        { onError: (error) => toast.show({ title: humanError(error), tone: 'error' }) },
      );
    } catch (error) {
      toast.show({
        title: error instanceof PermissionDeniedError ? error.message : humanError(error),
        tone: 'error',
      });
    }
  };

  const sendFile = async () => {
    setAttachMenu(false);
    const result = await DocumentPicker.getDocumentAsync({
      type: FILE_TYPES,
      copyToCacheDirectory: true,
      multiple: false,
    });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    if ((asset.size ?? 0) > MAX_FILE) {
      toast.show({ title: 'Fichier trop lourd (20 Mo max).', tone: 'error' });
      return;
    }
    const isImage = (asset.mimeType ?? '').startsWith('image/');
    send.mutate(
      {
        id: newMessageId(),
        content: '',
        attachment: {
          kind: isImage ? 'image' : 'file',
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? 'application/octet-stream',
          size: asset.size ?? 0,
        },
      },
      { onError: (error) => toast.show({ title: humanError(error), tone: 'error' }) },
    );
  };

  const onBlock = async () => {
    setMenu(false);
    if (!conversation) return;
    const ok = await confirm({
      title: `Bloquer ${name} ?`,
      message:
        "Vous ne pourrez plus vous écrire ni vous voir dans l'app. Tu peux le débloquer dans Paramètres.",
      confirmLabel: 'Bloquer',
      destructive: true,
    });
    if (!ok) return;
    block.mutate(conversation.other_id, {
      onSuccess: () => {
        toast.show({ title: `${name} est bloqué·e` });
        router.back();
      },
      onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
    });
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/chat'));

  if (conversations.isSuccess && !conversation) {
    return (
      <Screen>
        <EmptyState
          emoji="🫥"
          title="Conversation introuvable"
          text="Elle a peut-être été supprimée ou la personne n'est plus disponible."
          actionLabel="Retour aux messages"
          onAction={() => router.replace('/chat')}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-2 border-b border-line/10 px-3 pb-2.5 pt-1">
        <IconButton
          icon={<ChevronLeft size={22} color={palette.text} />}
          accessibilityLabel="Retour"
          onPress={back}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Voir le profil de ${name}`}
          disabled={!conversation}
          onPress={() =>
            conversation &&
            router.push({ pathname: '/u/[id]', params: { id: conversation.other_id } })
          }
          className="flex-1 flex-row items-center gap-3 active:opacity-70">
          <Avatar
            uri={conversation?.other_avatar_url}
            firstName={conversation?.other_first_name}
            lastName={conversation?.other_last_name}
            size={40}
            gradient={MODES[otherMode].gradient}
            online={
              presence.otherHere || activityLabel(conversation?.other_last_active_at) === 'En ligne'
            }
          />
          <View className="flex-1">
            <Text variant="subheading" numberOfLines={1}>
              {name}
            </Text>
            <Text
              className={`text-[12px] ${presence.otherTyping ? 'font-semibold text-success' : 'text-muted'}`}
              numberOfLines={1}>
              {status}
            </Text>
          </View>
        </Pressable>
        <IconButton
          icon={<MoreVertical size={20} color={palette.text} />}
          accessibilityLabel="Options de la conversation"
          onPress={() => setMenu(true)}
        />
      </View>

      <Avoider behavior="padding" style={{ flex: 1 }}>
        {messages.isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={color} />
          </View>
        ) : (
          <FlashList
            data={items}
            keyExtractor={(item) => item.key}
            getItemType={(item) => (item.type === 'day' ? 'day' : item.message.type)}
            maintainVisibleContentPosition={{
              startRenderingFromBottom: true,
              autoscrollToBottomThreshold: 0.25,
            }}
            onStartReached={() => {
              if (messages.hasNextPage && !messages.isFetchingNextPage)
                void messages.fetchNextPage();
            }}
            onStartReachedThreshold={0.3}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 8 }}
            ListHeaderComponent={
              messages.isFetchingNextPage ? (
                <ActivityIndicator className="py-3" color={palette.muted} />
              ) : !messages.hasNextPage && conversation ? (
                <View className="items-center gap-2 px-8 pb-4 pt-6">
                  <Avatar
                    uri={conversation.other_avatar_url}
                    firstName={conversation.other_first_name}
                    lastName={conversation.other_last_name}
                    size={72}
                    gradient={MODES[otherMode].gradient}
                  />
                  <Text variant="heading" className="text-center">
                    {conversation.source === 'contact'
                      ? 'Mise en relation acceptée 🤝'
                      : "C'est un match ! 🎉"}
                  </Text>
                  <Text variant="caption" className="text-center">
                    Toi ({MODES[myMode].short}) et {conversation.other_first_name || name} (
                    {MODES[otherMode].short}) pouvez maintenant échanger.
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) =>
              item.type === 'day' ? (
                <Text variant="caption" className="py-3 text-center font-semibold">
                  {item.label}
                </Text>
              ) : (
                <MessageBubble
                  message={item.message}
                  mine={item.message.sender_id === myId}
                  tail={item.tail}
                  color={color}
                  mission={
                    typeof item.message.metadata === 'object' &&
                    item.message.metadata &&
                    'mission_id' in item.message.metadata
                      ? missionById.get(String(item.message.metadata.mission_id))
                      : undefined
                  }
                  matchId={matchId}
                  myId={myId}
                  onRetry={retry}
                />
              )
            }
          />
        )}

        {presence.otherTyping ? (
          <Text variant="caption" className="px-5 pb-1" accessibilityLiveRegion="polite">
            {conversation?.other_first_name || name} est en train d'écrire…
          </Text>
        ) : null}
        {messages.isSuccess && chronological.length === 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 px-3 pb-2">
            {FIRST_MESSAGE_SUGGESTIONS.map((s) => (
              <Chip key={s} label={s} size="sm" tone={myMode} onPress={() => sendText(s)} />
            ))}
          </ScrollView>
        ) : null}
        <Composer
          gradient={MODES[myMode].gradient}
          onSend={sendText}
          onAttach={() => setAttachMenu(true)}
          onTyping={() => presence.setTyping(true)}
          disabled={!conversation}
        />
      </Avoider>

      <Sheet visible={attachMenu} onClose={() => setAttachMenu(false)} title="Envoyer">
        <View className="px-2 pb-2">
          <ListRow
            icon={<Text>📷</Text>}
            title="Photo"
            subtitle="Depuis ta galerie"
            onPress={() => void sendPhoto()}
          />
          <ListRow
            icon={<Text>📎</Text>}
            title="Fichier"
            subtitle="PDF, Word, Excel, PowerPoint, ZIP — 20 Mo max"
            onPress={() => void sendFile()}
            last
          />
        </View>
      </Sheet>

      <Sheet visible={menu} onClose={() => setMenu(false)}>
        <View className="px-2 pb-2">
          <ListRow
            icon={<UserRound size={18} color={palette.text} />}
            title="Voir le profil"
            onPress={() => {
              setMenu(false);
              if (conversation)
                router.push({ pathname: '/u/[id]', params: { id: conversation.other_id } });
            }}
          />
          <ListRow
            icon={<Briefcase size={18} color={palette.text} />}
            title="Proposer une mission"
            subtitle="Flash, side project ou equity"
            onPress={() => {
              setMenu(false);
              setProposing(true);
            }}
          />
          <ListRow
            icon={<Flag size={18} color={palette.danger} />}
            title="Signaler"
            danger
            onPress={() => {
              setMenu(false);
              setReporting(true);
            }}
          />
          <ListRow
            icon={<Ban size={18} color={palette.danger} />}
            title={`Bloquer ${name}`}
            danger
            onPress={() => void onBlock()}
            last
          />
        </View>
      </Sheet>

      <ProposeMissionSheet
        matchId={matchId}
        visible={proposing}
        onClose={() => setProposing(false)}
      />
      {conversation ? (
        <ReportSheet
          visible={reporting}
          onClose={() => setReporting(false)}
          userId={conversation.other_id}
          name={name}
          matchId={matchId}
          onDone={(blocked) => {
            if (blocked) router.replace('/chat');
          }}
        />
      ) : null}
    </Screen>
  );
}
