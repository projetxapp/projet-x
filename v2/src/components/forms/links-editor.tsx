import { ExternalLink, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { Button, Chip, Text, TextField } from '@/components/ui';
import { LINK_TYPES } from '@/constants/profile-options';
import { normalizeUrl } from '@/lib/format';
import { useTheme } from '@/providers/theme-provider';
import type { LinkType, Mode, ProfileLink } from '@/types/app';

type Props = { value: ProfileLink[]; onChange?: (next: ProfileLink[]) => void; tone?: Mode };

export function LinksEditor({ value, onChange, tone = 'talent' }: Props) {
  const { palette } = useTheme();
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<LinkType>('site');
  const [url, setUrl] = useState('');
  const editable = Boolean(onChange);
  const meta = LINK_TYPES.find((l) => l.id === type) ?? LINK_TYPES[LINK_TYPES.length - 1]!;

  const add = () => {
    if (!url.trim() || !onChange) return;
    onChange(
      [...value, { type, label: meta.label, url: url.trim(), icon: meta.icon }].slice(0, 10),
    );
    setUrl('');
    setAdding(false);
  };

  return (
    <View className="gap-2">
      {value.length === 0 && !adding ? (
        <Text variant="caption">Aucun lien pour l'instant.</Text>
      ) : null}
      {value.map((link, index) => {
        const icon = link.icon ?? LINK_TYPES.find((l) => l.id === link.type)?.icon ?? '🔗';
        return (
          <Pressable
            key={`${link.url}-${index}`}
            accessibilityRole="link"
            accessibilityLabel={`${link.label} : ${link.url}`}
            disabled={editable}
            onPress={() => void Linking.openURL(normalizeUrl(link.url))}
            className="flex-row items-center gap-3 rounded-xl bg-surface px-3 py-2.5">
            <Text className="text-[16px]">{icon}</Text>
            <View className="flex-1">
              <Text className="text-[13px] font-semibold text-text">{link.label}</Text>
              <Text className="text-[12px] text-muted" numberOfLines={1}>
                {link.url}
              </Text>
            </View>
            {editable ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Supprimer le lien ${link.label}`}
                hitSlop={10}
                onPress={() => onChange?.(value.filter((_, i) => i !== index))}>
                <X size={16} color={palette.danger} />
              </Pressable>
            ) : (
              <ExternalLink size={15} color={palette.muted} />
            )}
          </Pressable>
        );
      })}

      {editable && adding ? (
        <View className="gap-3 rounded-field border border-line/10 bg-surface p-3">
          <View className="flex-row flex-wrap gap-1.5">
            {LINK_TYPES.map((l) => (
              <Chip
                key={l.id}
                size="sm"
                emoji={l.icon}
                label={l.label}
                selected={type === l.id}
                tone={tone}
                onPress={() => setType(l.id)}
              />
            ))}
          </View>
          <TextField
            value={url}
            onChangeText={setUrl}
            placeholder={meta.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onSubmitEditing={add}
            accessibilityLabel={`Lien ${meta.label}`}
          />
          <View className="flex-row gap-2">
            <Button
              title="Annuler"
              variant="ghost"
              size="sm"
              className="flex-1"
              onPress={() => setAdding(false)}
            />
            <Button
              title="Ajouter"
              size="sm"
              className="flex-1"
              onPress={add}
              disabled={!url.trim()}
            />
          </View>
        </View>
      ) : editable && value.length < 10 ? (
        <Button
          title="Ajouter un lien"
          variant="outline"
          size="sm"
          icon={<Plus size={15} color={palette.muted} />}
          onPress={() => setAdding(true)}
        />
      ) : null}
    </View>
  );
}
