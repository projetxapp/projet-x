import { Plus, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Chip, Text, TextField } from '@/components/ui';
import { MODES } from '@/constants/modes';
import { useTheme } from '@/providers/theme-provider';
import type { Mode } from '@/types/app';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  catalogue: readonly string[];
  popular?: readonly string[];
  clusters?: Readonly<Record<string, readonly string[]>>;
  max?: number;
  placeholder?: string;
  tone?: Mode;
  label?: string;
};

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

/** Search-as-you-type tag picker: suggestions, "dans le même style", popular, custom tags. */
export function TagSelector({
  value,
  onChange,
  catalogue,
  popular = [],
  clusters = {},
  max = 10,
  placeholder = 'Tape une lettre pour chercher…',
  tone = 'talent',
  label,
}: Props) {
  const { palette } = useTheme();
  const [query, setQuery] = useState('');
  const full = value.length >= max;
  const selected = useMemo(() => new Set(value.map(normalize)), [value]);

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    const available = catalogue.filter((item) => !selected.has(normalize(item)));
    const starts = available.filter((item) => normalize(item).startsWith(q));
    const contains = available.filter(
      (item) => !normalize(item).startsWith(q) && normalize(item).includes(q),
    );
    return [...starts, ...contains].slice(0, 8);
  }, [catalogue, query, selected]);

  const related = useMemo(() => {
    const out: string[] = [];
    for (const item of value) {
      for (const candidate of clusters[item] ?? []) {
        if (!selected.has(normalize(candidate)) && !out.includes(candidate)) out.push(candidate);
      }
    }
    return out.slice(0, 6);
  }, [clusters, selected, value]);

  const exactExists =
    catalogue.some((item) => normalize(item) === normalize(query)) ||
    selected.has(normalize(query));

  const add = (tag: string) => {
    const clean = tag.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (!clean || full || selected.has(normalize(clean))) return;
    onChange([...value, clean]);
    setQuery('');
  };

  return (
    <View className="gap-3">
      {value.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {value.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              selected
              tone={tone}
              onRemove={() => onChange(value.filter((t) => t !== tag))}
            />
          ))}
        </View>
      ) : null}

      <View className="flex-row items-center justify-between">
        <Text variant="caption">{label ?? `Jusqu'à ${max}`}</Text>
        <Text className="text-[12px] font-bold" style={{ color: full ? '#4ADE80' : palette.muted }}>
          {value.length}/{max}
        </Text>
      </View>

      <TextField
        value={query}
        onChangeText={setQuery}
        editable={!full}
        placeholder={full ? 'Maximum atteint ✓' : placeholder}
        accent={MODES[tone].color}
        left={<Search size={17} color={palette.muted} />}
        returnKeyType="done"
        autoCorrect={false}
        onSubmitEditing={() => add(suggestions[0] ?? query)}
        accessibilityLabel={placeholder}
      />

      {query.trim().length > 0 ? (
        <View className="overflow-hidden rounded-field border border-line/10 bg-card">
          {suggestions.map((item, index) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`Ajouter ${item}`}
              onPress={() => add(item)}
              className={`flex-row items-center gap-2.5 px-4 py-3 ${index > 0 ? 'border-t border-line/10' : ''}`}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <Plus size={14} color={palette.muted} />
              <Text className="text-[14px] text-text">{item}</Text>
            </Pressable>
          ))}
          {!exactExists ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ajouter ${query.trim()}`}
              onPress={() => add(query)}
              className="border-t border-line/10 px-4 py-3"
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                backgroundColor: `${MODES[tone].color}14`,
              })}>
              <Text className="text-[13px] font-semibold" style={{ color: MODES[tone].light }}>
                + Ajouter « {query.trim()} »
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {query.length === 0 && related.length > 0 && !full ? (
        <View className="gap-2">
          <Text variant="overline">💡 Dans le même style</Text>
          <View className="flex-row flex-wrap gap-2">
            {related.map((item) => (
              <Chip
                key={item}
                label={`+ ${item}`}
                size="sm"
                onPress={() => add(item)}
                accessibilityLabel={`Ajouter ${item}`}
              />
            ))}
          </View>
        </View>
      ) : null}

      {query.length === 0 && value.length === 0 && popular.length > 0 ? (
        <View className="gap-2">
          <Text variant="overline">Populaires</Text>
          <View className="flex-row flex-wrap gap-2">
            {popular.map((item) => (
              <Chip
                key={item}
                label={`+ ${item}`}
                size="sm"
                onPress={() => add(item)}
                accessibilityLabel={`Ajouter ${item}`}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
