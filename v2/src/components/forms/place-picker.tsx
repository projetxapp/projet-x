import { MapPin, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text, TextField } from '@/components/ui';
import { DEPARTEMENTS } from '@/constants/places';
import { useTheme } from '@/providers/theme-provider';

type Props = {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  label?: string;
  optional?: boolean;
};

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Département picker: 96 départements + DROM + Remote + International. */
export function PlacePicker({ value, onChange, label = 'Département', optional = true }: Props) {
  const { palette } = useTheme();
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return DEPARTEMENTS.filter((d) => normalize(d).includes(q)).slice(0, 6);
  }, [query]);

  if (value) {
    return (
      <View className="gap-2">
        <Text variant="overline">{label}</Text>
        <View className="min-h-[52px] flex-row items-center gap-2.5 rounded-field border-[1.5px] border-line/10 bg-surface px-3.5">
          <MapPin size={17} color={palette.muted} />
          <Text className="flex-1 text-[16px] text-text">{value}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Changer de département"
            hitSlop={10}
            onPress={() => onChange(null)}>
            <X size={18} color={palette.muted} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-2">
      <TextField
        label={label}
        optional={optional}
        value={query}
        onChangeText={setQuery}
        placeholder="75, Lyon, Remote…"
        left={<MapPin size={17} color={palette.muted} />}
        autoCorrect={false}
      />
      {results.length > 0 ? (
        <View className="overflow-hidden rounded-field border border-line/10 bg-card">
          {results.map((d, index) => (
            <Pressable
              key={d}
              accessibilityRole="button"
              onPress={() => {
                onChange(d);
                setQuery('');
              }}
              className={`px-4 py-3 ${index > 0 ? 'border-t border-line/10' : ''}`}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <Text className="text-[14px] text-text">📍 {d}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
