import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, Chip, Sheet, Text, TextField, useToast } from '@/components/ui';
import { MODES } from '@/constants/modes';
import { useRequestContact } from '@/features/social/api';
import { humanError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import type { Mode } from '@/types/app';

type Props = {
  visible: boolean;
  onClose: () => void;
  userId: string;
  name: string;
  myModes: Mode[];
  defaultMode: Mode;
};

/** « Demander une mise en relation » — replaces v1's direct match creation (mutual consent). */
export function ContactSheet({ visible, onClose, userId, name, myModes, defaultMode }: Props) {
  const router = useRouter();
  const toast = useToast();
  const request = useRequestContact();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [message, setMessage] = useState('');

  const submit = () =>
    request.mutate(
      { userId, mode, message: message.trim() },
      {
        onSuccess: (result) => {
          haptics.success();
          onClose();
          if (result.status === 'matched' && result.match_id) {
            toast.show({ title: `Vous êtes en contact avec ${name} 🎉`, tone: 'success' });
            router.push({ pathname: '/chat/[id]', params: { id: result.match_id } });
          } else {
            toast.show({
              title: 'Demande envoyée ✉️',
              body: `${name} sera notifié·e.`,
              tone: 'success',
            });
          }
        },
        onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
      },
    );

  return (
    <Sheet visible={visible} onClose={onClose} title={`Contacter ${name}`}>
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-4 pt-2"
        keyboardShouldPersistTaps="handled">
        <Text variant="body" className="text-muted">
          {name} recevra ta demande. S'il ou elle accepte, une conversation s'ouvre entre vous.
        </Text>
        {myModes.length > 1 ? (
          <View className="gap-2">
            <Text variant="overline">Je me présente en tant que</Text>
            <View className="flex-row flex-wrap gap-2">
              {myModes.map((m) => (
                <Chip
                  key={m}
                  label={MODES[m].label}
                  emoji={MODES[m].emoji}
                  tone={m}
                  selected={mode === m}
                  onPress={() => setMode(m)}
                />
              ))}
            </View>
          </View>
        ) : null}
        <TextField
          label="Message"
          optional
          value={message}
          onChangeText={setMessage}
          placeholder={`Présente-toi et explique pourquoi tu veux échanger avec ${name}.`}
          multiline
          maxLength={500}
          hint={`${message.length}/500`}
        />
        <Button
          title="Envoyer la demande"
          gradient={MODES[mode].gradient}
          loading={request.isPending}
          onPress={submit}
        />
      </ScrollView>
    </Sheet>
  );
}
