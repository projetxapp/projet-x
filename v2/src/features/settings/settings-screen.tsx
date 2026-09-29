import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Ban,
  Download,
  FileText,
  KeyRound,
  LogOut,
  Mail,
  MessageCircle,
  Shield,
  Trash2,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Linking, Platform, Switch, View } from 'react-native';

import { StackHeader } from '@/components/app/stack-header';
import { Card, Chip, ListRow, Screen, Text, useToast } from '@/components/ui';
import { CONTACT_EMAIL, SITE_URL } from '@/constants/brand';
import { useMe, useSetMe } from '@/features/me/api';
import { confirm } from '@/lib/confirm';
import { humanError } from '@/lib/errors';
import { shareJson } from '@/lib/export-file';
import { getPushPermission, registerForPush } from '@/lib/push';
import { useAuth } from '@/providers/auth-provider';
import { useTheme, type ThemePreference } from '@/providers/theme-provider';
import type { UserSettingsRow } from '@/types/app';

import { useExportData, useUpdateSettings } from './api';
import { DeleteAccountSheet, EmailSheet, PasswordSheet } from './settings-sheets';

const THEMES: { id: ThemePreference; label: string; emoji: string }[] = [
  { id: 'dark', label: 'Sombre', emoji: '🌙' },
  { id: 'light', label: 'Clair', emoji: '☀️' },
  { id: 'system', label: 'Système', emoji: '📱' },
];

type PushKey = 'push_enabled' | 'push_messages' | 'push_matches' | 'push_likes';

export function SettingsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { signOut } = useAuth();
  const { palette, preference, setPreference } = useTheme();
  const { data: me } = useMe();
  const setMe = useSetMe();
  const updateSettings = useUpdateSettings();
  const exportData = useExportData();
  const [sheet, setSheet] = useState<'password' | 'email' | 'delete' | null>(null);
  const permission = useQuery({
    queryKey: ['push-permission'],
    queryFn: getPushPermission,
    enabled: Platform.OS !== 'web',
  });
  const settings = me?.settings;

  const toggle = async (key: PushKey, value: boolean) => {
    if (key === 'push_enabled' && value && permission.data !== 'granted') {
      const token = await registerForPush(true);
      await permission.refetch();
      if (!token) {
        toast.show({
          title: 'Autorise les notifications dans les réglages de ton téléphone.',
          tone: 'error',
        });
        return;
      }
    }
    setMe((prev) =>
      prev.settings
        ? { ...prev, settings: { ...prev.settings, [key]: value } as UserSettingsRow }
        : prev,
    );
    updateSettings.mutate(
      { [key]: value },
      { onError: (error) => toast.show({ title: humanError(error), tone: 'error' }) },
    );
  };

  const onExport = () =>
    exportData.mutate(undefined, {
      onSuccess: async (data) => {
        await shareJson(`projetx-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`, data);
        toast.show({ title: 'Export prêt ✅', tone: 'success' });
      },
      onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
    });

  const onSignOut = async () => {
    const ok = await confirm({ title: 'Se déconnecter ?', confirmLabel: 'Déconnexion' });
    if (!ok) return;
    await signOut();
    router.replace('/');
  };

  const openLegal = (path: '/cgu' | '/confidentialite') =>
    Platform.OS === 'web'
      ? router.push(path)
      : void WebBrowser.openBrowserAsync(`${SITE_URL}${path}`);

  return (
    <Screen scroll>
      <StackHeader title="Paramètres" />
      <View className="gap-6 px-5">
        <Group title="Compte">
          <ListRow
            icon={<Mail size={18} color={palette.text} />}
            title="Email"
            subtitle={me?.email ?? undefined}
            onPress={() => setSheet('email')}
          />
          <ListRow
            icon={<KeyRound size={18} color={palette.text} />}
            title="Mot de passe"
            onPress={() => setSheet('password')}
            last
          />
        </Group>

        <Group title="Apparence">
          <View className="flex-row flex-wrap gap-2 p-4">
            {THEMES.map((t) => (
              <Chip
                key={t.id}
                label={t.label}
                emoji={t.emoji}
                selected={preference === t.id}
                onPress={() => setPreference(t.id)}
              />
            ))}
          </View>
        </Group>

        <Group title="Notifications">
          {Platform.OS === 'web' ? (
            <Text variant="caption" className="p-4">
              Les notifications push sont disponibles dans l'app mobile. Sur le web, tu les
              retrouves dans la cloche 🔔.
            </Text>
          ) : settings ? (
            <>
              <Toggle
                label="Notifications push"
                value={settings.push_enabled}
                onChange={(v) => void toggle('push_enabled', v)}
              />
              <Toggle
                label="Messages"
                value={settings.push_messages}
                disabled={!settings.push_enabled}
                onChange={(v) => void toggle('push_messages', v)}
              />
              <Toggle
                label="Matchs et mises en relation"
                value={settings.push_matches}
                disabled={!settings.push_enabled}
                onChange={(v) => void toggle('push_matches', v)}
              />
              <Toggle
                label="Likes reçus"
                value={settings.push_likes}
                disabled={!settings.push_enabled}
                onChange={(v) => void toggle('push_likes', v)}
                last
              />
            </>
          ) : null}
        </Group>

        <Group title="Confidentialité">
          <ListRow
            icon={<Ban size={18} color={palette.text} />}
            title="Utilisateurs bloqués"
            onPress={() => router.push('/bloques')}
          />
          <ListRow
            icon={<Download size={18} color={palette.text} />}
            title="Exporter mes données"
            subtitle={exportData.isPending ? 'Préparation…' : 'Fichier JSON (RGPD)'}
            onPress={onExport}
          />
          <ListRow
            icon={<Shield size={18} color={palette.text} />}
            title="Politique de confidentialité"
            onPress={() => openLegal('/confidentialite')}
          />
          <ListRow
            icon={<FileText size={18} color={palette.text} />}
            title="Conditions d'utilisation"
            onPress={() => openLegal('/cgu')}
            last
          />
        </Group>

        <Group title="Aide">
          <ListRow
            icon={<MessageCircle size={18} color={palette.text} />}
            title="Nous contacter"
            subtitle={CONTACT_EMAIL}
            onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=Projet%20X`)}
            last
          />
        </Group>

        <Group>
          <ListRow
            icon={<LogOut size={18} color={palette.text} />}
            title="Se déconnecter"
            onPress={() => void onSignOut()}
          />
          <ListRow
            icon={<Trash2 size={18} color={palette.danger} />}
            title="Supprimer mon compte"
            danger
            onPress={() => setSheet('delete')}
            last
          />
        </Group>

        <Text variant="caption" className="text-center">
          Projet X · version {Constants.expoConfig?.version ?? '2.0.0'}
        </Text>
      </View>

      <PasswordSheet visible={sheet === 'password'} onClose={() => setSheet(null)} />
      <EmailSheet
        visible={sheet === 'email'}
        onClose={() => setSheet(null)}
        current={me?.email ?? null}
      />
      <DeleteAccountSheet visible={sheet === 'delete'} onClose={() => setSheet(null)} />
    </Screen>
  );
}

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      {title ? <Text variant="overline">{title}</Text> : null}
      <Card className="p-0">{children}</Card>
    </View>
  );
}

function Toggle({
  label,
  value,
  onChange,
  disabled,
  last,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3 ${last ? '' : 'border-b border-line/10'} ${disabled ? 'opacity-50' : ''}`}>
      <Text className="text-[15px] font-semibold text-text">{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={label}
        trackColor={{ true: '#6D28D9' }}
      />
    </View>
  );
}
