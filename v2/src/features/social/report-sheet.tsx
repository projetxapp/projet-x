import { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';

import { Button, Chip, Sheet, Text, TextField, useToast } from '@/components/ui';
import { humanError } from '@/lib/errors';
import type { ReportReason } from '@/types/app';

import { REPORT_REASONS, useReportUser } from './api';

type Props = {
  visible: boolean;
  onClose: () => void;
  userId: string;
  name: string;
  matchId?: string;
  messageId?: string;
  onDone?: (blocked: boolean) => void;
};

/** "Signaler" (App Store requirement): reason, details, optional block. */
export function ReportSheet({ visible, onClose, userId, name, matchId, messageId, onDone }: Props) {
  const toast = useToast();
  const report = useReportUser();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [block, setBlock] = useState(true);

  const submit = () => {
    if (!reason) return;
    report.mutate(
      { userId, reason, details: details.trim(), matchId, messageId, block },
      {
        onSuccess: () => {
          toast.show({
            title: 'Merci, ton signalement a été envoyé',
            body: 'Notre équipe le traite rapidement.',
            tone: 'success',
          });
          setReason(null);
          setDetails('');
          onClose();
          onDone?.(block);
        },
        onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
      },
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={`Signaler ${name}`}>
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-4 pt-2"
        keyboardShouldPersistTaps="handled">
        <Text variant="body" className="text-muted">
          Ton signalement reste anonyme. Dis-nous ce qui ne va pas :
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {REPORT_REASONS.map((r) => (
            <Chip
              key={r.id}
              label={r.label}
              selected={reason === r.id}
              onPress={() => setReason(r.id)}
              tone="talent"
            />
          ))}
        </View>
        <TextField
          label="Détails"
          optional
          value={details}
          onChangeText={setDetails}
          placeholder="Explique en quelques mots (facultatif)"
          multiline
          maxLength={1000}
        />
        <View className="flex-row items-center justify-between gap-3 rounded-field bg-surface px-4 py-3">
          <View className="flex-1">
            <Text variant="subheading">Bloquer aussi {name}</Text>
            <Text variant="caption">Vous ne pourrez plus vous voir ni vous écrire.</Text>
          </View>
          <Switch value={block} onValueChange={setBlock} accessibilityLabel={`Bloquer ${name}`} />
        </View>
        <Button
          title="Envoyer le signalement"
          variant="danger"
          disabled={!reason}
          loading={report.isPending}
          onPress={submit}
        />
      </ScrollView>
    </Sheet>
  );
}
