import { ArrowUp, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

import { Gradient } from '@/components/ui';
import { useTheme } from '@/providers/theme-provider';

type Props = {
  gradient: readonly [string, string];
  onSend: (text: string) => void;
  onAttach: () => void;
  onTyping: () => void;
  disabled?: boolean;
};

/** Message input: attachments, multiline text, send. */
export function Composer({ gradient, onSend, onAttach, onTyping, disabled }: Props) {
  const { palette } = useTheme();
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !disabled;

  const send = () => {
    if (!canSend) return;
    onSend(text);
    setText('');
  };

  return (
    <View className="flex-row items-end gap-2 border-t border-line/10 bg-bg px-3 pb-2 pt-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Joindre une photo ou un fichier"
        onPress={onAttach}
        disabled={disabled}
        hitSlop={6}
        className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-70">
        <Plus size={22} color={palette.muted} />
      </Pressable>
      <TextInput
        testID="chat-input"
        value={text}
        onChangeText={(value) => {
          setText(value);
          if (value.trim()) onTyping();
        }}
        placeholder="Écris ton message…"
        placeholderTextColor={palette.hint}
        accessibilityLabel="Message"
        multiline
        maxLength={4000}
        editable={!disabled}
        onKeyPress={(event) => {
          // Web: Enter sends, Shift+Enter adds a line.
          const e = event.nativeEvent as { key: string; shiftKey?: boolean };
          if (Platform.OS === 'web' && e.key === 'Enter' && !e.shiftKey) {
            (event as unknown as { preventDefault: () => void }).preventDefault();
            send();
          }
        }}
        className="max-h-[120px] min-h-[44px] flex-1 rounded-[22px] border border-line/10 bg-surface px-4 py-2.5 text-[15px] leading-[20px] text-text"
      />
      <Pressable
        testID="chat-send"
        accessibilityRole="button"
        accessibilityLabel="Envoyer"
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={send}
        className={`active:scale-90 ${canSend ? '' : 'opacity-40'}`}>
        <Gradient
          colors={gradient}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ArrowUp size={22} color="#FFFFFF" strokeWidth={2.6} />
        </Gradient>
      </Pressable>
    </View>
  );
}
