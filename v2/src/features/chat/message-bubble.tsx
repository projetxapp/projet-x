import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { AlertCircle, Check, CheckCheck, Clock, FileText } from 'lucide-react-native';
import { memo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';

import { Skeleton, Text } from '@/components/ui';
import { formatBytes, timeOfDay } from '@/lib/format';
import { useTheme } from '@/providers/theme-provider';
import type { MissionRow } from '@/types/app';

import { useSignedUrl, type ChatMessage } from './api';
import { MissionCard } from './mission-card';

type Props = {
  message: ChatMessage;
  mine: boolean;
  /** Last message of a group from the same sender: shows time + delivery state. */
  tail: boolean;
  /** Color of my bubbles (mode of the conversation). */
  color: string;
  mission?: MissionRow;
  matchId: string;
  myId: string | undefined;
  onRetry: (message: ChatMessage) => void;
};

export const MessageBubble = memo(function MessageBubble({
  message,
  mine,
  tail,
  color,
  mission,
  matchId,
  myId,
  onRetry,
}: Props) {
  if (message.type === 'system') {
    return (
      <View className="items-center px-6 py-2">
        <Text variant="caption" className="text-center">
          {message.content}
        </Text>
      </View>
    );
  }

  const body =
    message.type === 'mission' ? (
      mission ? (
        <MissionCard mission={mission} matchId={matchId} myId={myId} />
      ) : (
        <View className="w-[280px] rounded-card border border-line/10 bg-card p-4">
          <Text variant="subheading">💼 {message.content}</Text>
        </View>
      )
    ) : message.type === 'image' ? (
      <ImageAttachment message={message} />
    ) : message.type === 'file' ? (
      <FileAttachment message={message} mine={mine} color={color} />
    ) : (
      <View
        className={`max-w-[80%] rounded-[20px] px-3.5 py-2.5 ${mine ? 'rounded-br-md' : 'rounded-bl-md bg-surface'}`}
        style={mine ? { backgroundColor: color } : undefined}>
        <Text
          selectable
          className={`text-[15px] leading-[21px] ${mine ? 'text-white' : 'text-text'}`}>
          {message.content}
        </Text>
      </View>
    );

  return (
    <View className={`px-4 ${tail ? 'pb-2.5' : 'pb-1'} ${mine ? 'items-end' : 'items-start'}`}>
      {body}
      {tail || message.failed ? <Meta message={message} mine={mine} onRetry={onRetry} /> : null}
    </View>
  );
});

function Meta({
  message,
  mine,
  onRetry,
}: {
  message: ChatMessage;
  mine: boolean;
  onRetry: (m: ChatMessage) => void;
}) {
  const { palette } = useTheme();
  if (message.failed) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Échec de l'envoi, réessayer"
        onPress={() => onRetry(message)}
        className="mt-1 flex-row items-center gap-1">
        <AlertCircle size={13} color={palette.danger} />
        <Text className="text-[12px] font-semibold text-danger-fg">Non envoyé · Réessayer</Text>
      </Pressable>
    );
  }
  return (
    <View className="mt-1 flex-row items-center gap-1">
      <Text className="text-[11px] text-hint">{timeOfDay(message.created_at)}</Text>
      {mine ? (
        message.pending ? (
          <Clock size={12} color={palette.hint} accessibilityLabel="Envoi en cours" />
        ) : message.seen ? (
          <CheckCheck size={14} color="#38BDF8" accessibilityLabel="Lu" />
        ) : (
          <Check size={14} color={palette.hint} accessibilityLabel="Envoyé" />
        )
      ) : null}
    </View>
  );
}

function ImageAttachment({ message }: { message: ChatMessage }) {
  const signed = useSignedUrl(message.localUri ? null : message.attachment_url);
  const uri = message.localUri ?? signed.data;
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel="Photo envoyée, agrandir"
        onPress={() => uri && setOpen(true)}
        className="overflow-hidden rounded-[20px] bg-surface">
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: 230, height: 260 }}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
          />
        ) : (
          <Skeleton width={230} height={260} radius={20} />
        )}
        {message.pending ? (
          <View className="absolute inset-0 items-center justify-center bg-black/30">
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : null}
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          accessibilityLabel="Fermer"
          onPress={() => setOpen(false)}
          className="flex-1 items-center justify-center bg-black/95 p-4">
          {uri ? (
            <Image source={{ uri }} style={{ width: '100%', height: '85%' }} contentFit="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

function FileAttachment({
  message,
  mine,
  color,
}: {
  message: ChatMessage;
  mine: boolean;
  color: string;
}) {
  const signed = useSignedUrl(message.attachment_url);
  const open = () => {
    const url = signed.data ?? message.localUri;
    if (url) void WebBrowser.openBrowserAsync(url);
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Fichier ${message.attachment_name ?? ''}, ouvrir`}
      onPress={open}
      className={`max-w-[80%] flex-row items-center gap-3 rounded-[20px] px-3.5 py-3 ${mine ? '' : 'bg-surface'}`}
      style={mine ? { backgroundColor: color } : undefined}>
      <View
        className={`h-10 w-10 items-center justify-center rounded-xl ${mine ? 'bg-white/20' : 'bg-card'}`}>
        {message.pending ? (
          <ActivityIndicator color={mine ? '#FFFFFF' : undefined} />
        ) : (
          <FileText size={20} color={mine ? '#FFFFFF' : color} />
        )}
      </View>
      <View className="shrink">
        <Text
          className={`text-[14px] font-semibold ${mine ? 'text-white' : 'text-text'}`}
          numberOfLines={1}>
          {message.attachment_name ?? 'Fichier'}
        </Text>
        <Text className={`text-[12px] ${mine ? 'text-white/75' : 'text-muted'}`}>
          {formatBytes(message.attachment_size) || 'Ouvrir'}
        </Text>
      </View>
    </Pressable>
  );
}
