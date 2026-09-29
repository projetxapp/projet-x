import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button, Chip, Sheet, Text, TextField, useToast } from '@/components/ui';
import { humanError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';

import { useProposeMission } from './api';

const MODES = [
  { id: 'flash', label: '⚡ Mission Flash', hint: 'Tâche précise et rémunérée' },
  { id: 'side', label: '🚀 Side project', hint: 'Collaboration régulière' },
  { id: 'equity', label: '💎 Equity', hint: 'Des parts du projet' },
] as const;

const amount = (max: number, message: string) =>
  z
    .string()
    .trim()
    .refine(
      (v) => v === '' || (/^\d+([.,]\d+)?$/.test(v) && Number(v.replace(',', '.')) <= max),
      message,
    );

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Donne un titre d'au moins 3 caractères")
    .max(80, '80 caractères maximum'),
  description: z.string().trim().max(1000, '1 000 caractères maximum'),
  mode: z.enum(['flash', 'side', 'equity']),
  budget: amount(10_000_000, 'Montant invalide'),
  equity: amount(100, 'Pourcentage entre 0 et 100'),
});
type Values = z.infer<typeof schema>;

const toNumber = (v: string): number | null =>
  v.trim() === '' ? null : Number(v.replace(',', '.'));

/** Propose a mission from the conversation (title, type, budget / equity). */
export function ProposeMissionSheet({
  matchId,
  visible,
  onClose,
}: {
  matchId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const propose = useProposeMission(matchId);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', mode: 'flash', budget: '', equity: '' },
    mode: 'onTouched',
  });
  const mode = useWatch({ control: form.control, name: 'mode' });

  const submit = form.handleSubmit((values) =>
    propose.mutateAsync(
      {
        title: values.title,
        description: values.description,
        mode: values.mode,
        budget: toNumber(values.budget),
        equity: values.mode === 'equity' ? toNumber(values.equity) : null,
      },
      {
        onSuccess: () => {
          haptics.success();
          form.reset();
          onClose();
          toast.show({ title: 'Mission proposée 💼', tone: 'success' });
        },
        onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
      },
    ),
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Proposer une mission">
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-4 pt-2"
        keyboardShouldPersistTaps="handled">
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <TextField
              label="Titre"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Ex. Maquettes Figma de l'onboarding"
              error={fieldState.error?.message}
              maxLength={80}
            />
          )}
        />
        <View className="gap-2">
          <Text variant="overline">Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {MODES.map((m) => (
              <Chip
                key={m.id}
                label={m.label}
                selected={mode === m.id}
                onPress={() => form.setValue('mode', m.id)}
                tone="project"
              />
            ))}
          </View>
          <Text variant="caption">{MODES.find((m) => m.id === mode)?.hint}</Text>
        </View>
        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <TextField
              label="Description"
              optional
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Livrables, délais, contexte…"
              multiline
              error={fieldState.error?.message}
              maxLength={1000}
            />
          )}
        />
        <View className="flex-row gap-3">
          <Controller
            control={form.control}
            name="budget"
            render={({ field, fieldState }) => (
              <TextField
                className="flex-1"
                label="Budget (€)"
                optional
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                keyboardType="decimal-pad"
                placeholder="300"
                error={fieldState.error?.message}
              />
            )}
          />
          {mode === 'equity' ? (
            <Controller
              control={form.control}
              name="equity"
              render={({ field, fieldState }) => (
                <TextField
                  className="flex-1"
                  label="Equity (%)"
                  optional
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  keyboardType="decimal-pad"
                  placeholder="5"
                  error={fieldState.error?.message}
                />
              )}
            />
          ) : null}
        </View>
        <Button
          title="Envoyer la proposition"
          loading={form.formState.isSubmitting}
          onPress={() => void submit()}
        />
      </ScrollView>
    </Sheet>
  );
}
