import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { z } from 'zod';

import { Button, Sheet, Text, TextField, useToast } from '@/components/ui';
import { humanError } from '@/lib/errors';

import { useChangeEmail, useChangePassword, useDeleteAccount } from './api';

const passwordSchema = z
  .object({
    password: z.string().min(8, '8 caractères minimum'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Les deux mots de passe ne correspondent pas',
  });

export function PasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const change = useChangePassword();
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirm: '' },
  });
  const submit = form.handleSubmit((v) =>
    change.mutateAsync(v.password, {
      onSuccess: () => {
        toast.show({ title: 'Mot de passe modifié ✅', tone: 'success' });
        form.reset();
        onClose();
      },
      onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
    }),
  );
  return (
    <Sheet visible={visible} onClose={onClose} title="Changer mon mot de passe">
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-4 pt-2"
        keyboardShouldPersistTaps="handled">
        {(['password', 'confirm'] as const).map((name) => (
          <Controller
            key={name}
            control={form.control}
            name={name}
            render={({ field, fieldState }) => (
              <TextField
                label={name === 'password' ? 'Nouveau mot de passe' : 'Confirmation'}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                secureTextEntry
                autoComplete="new-password"
                error={fieldState.error?.message}
              />
            )}
          />
        ))}
        <Button
          title="Enregistrer"
          loading={form.formState.isSubmitting}
          onPress={() => void submit()}
        />
      </ScrollView>
    </Sheet>
  );
}

const emailSchema = z.object({ email: z.string().trim().pipe(z.email('Adresse email invalide')) });

export function EmailSheet({
  visible,
  onClose,
  current,
}: {
  visible: boolean;
  onClose: () => void;
  current: string | null;
}) {
  const toast = useToast();
  const change = useChangeEmail();
  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });
  const submit = form.handleSubmit((v) =>
    change.mutateAsync(v.email.toLowerCase(), {
      onSuccess: () => {
        toast.show({
          title: 'Vérifie tes emails 📬',
          body: 'Clique sur le lien envoyé à ta nouvelle adresse pour confirmer.',
          tone: 'success',
        });
        form.reset();
        onClose();
      },
      onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
    }),
  );
  return (
    <Sheet visible={visible} onClose={onClose} title="Changer mon email">
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-4 pt-2"
        keyboardShouldPersistTaps="handled">
        {current ? <Text variant="caption">Adresse actuelle : {current}</Text> : null}
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label="Nouvelle adresse"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={fieldState.error?.message}
            />
          )}
        />
        <Button
          title="Envoyer le lien de confirmation"
          loading={form.formState.isSubmitting}
          onPress={() => void submit()}
        />
      </ScrollView>
    </Sheet>
  );
}

const CONFIRM_WORD = 'SUPPRIMER';

/** RGPD: full deletion (data + storage + auth) after typing SUPPRIMER. */
export function DeleteAccountSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const remove = useDeleteAccount();
  const [text, setText] = useState('');
  const ok = text.trim().toUpperCase() === CONFIRM_WORD;
  return (
    <Sheet visible={visible} onClose={onClose} title="Supprimer mon compte">
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-4 pt-2"
        keyboardShouldPersistTaps="handled">
        <Text variant="body">
          Ton profil, tes matchs, tes messages, tes photos et tes fichiers seront{' '}
          <Text className="font-bold text-danger-fg">définitivement supprimés</Text>. Cette action
          est irréversible.
        </Text>
        <Text variant="caption">Astuce : exporte tes données avant, depuis les paramètres.</Text>
        <TextField
          label={`Tape ${CONFIRM_WORD} pour confirmer`}
          value={text}
          onChangeText={setText}
          autoCapitalize="characters"
          autoCorrect={false}
          accent="#F87171"
          testID="delete-confirm"
        />
        <Button
          title="Supprimer définitivement"
          variant="danger"
          disabled={!ok}
          loading={remove.isPending}
          onPress={() =>
            remove.mutate(undefined, {
              onSuccess: () => toast.show({ title: 'Ton compte a été supprimé. À bientôt 👋' }),
              onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
            })
          }
        />
      </ScrollView>
    </Sheet>
  );
}
