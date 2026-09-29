import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button, Sheet, Text, useToast } from '@/components/ui';
import { MODE_ORDER, MODES } from '@/constants/modes';
import { useActivateMode, useActiveMode } from '@/features/me/api';
import { cn } from '@/lib/cn';
import { humanError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/providers/theme-provider';
import { modeTextColor } from '@/theme/palette';
import type { Mode } from '@/types/app';

/** ⚡ Talent · 🚀 Projet · 💎 Invest — present at the top of every main tab. */
export function ModeSelector() {
  const router = useRouter();
  const toast = useToast();
  const { scheme } = useTheme();
  const { mode, modes, setMode } = useActiveMode();
  const activate = useActivateMode();
  const [pending, setPending] = useState<Mode | null>(null);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
        accessibilityRole="tablist">
        {MODE_ORDER.map((id) => {
          const cfg = MODES[id];
          const active = id === mode;
          const owned = modes.includes(id);
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={owned ? `Mode ${cfg.label}` : `Activer le mode ${cfg.label}`}
              onPress={() => {
                haptics.selection();
                if (owned) setMode(id);
                else setPending(id);
              }}
              className={cn(
                'flex-row items-center gap-1.5 rounded-chip border px-3.5 py-2',
                !active && 'border-line/10',
              )}
              style={({ pressed }) => [
                active
                  ? { backgroundColor: `${cfg.color}26`, borderColor: `${cfg.color}99` }
                  : null,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}>
              <Text className="text-[13px]">{cfg.emoji}</Text>
              <Text
                className={cn('text-[13px] font-bold', !active && 'text-muted')}
                style={active ? { color: modeTextColor(id, scheme) } : undefined}>
                {cfg.short}
              </Text>
              {!owned ? <Plus size={13} color="#F97316" strokeWidth={3} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <Sheet
        visible={pending !== null}
        onClose={() => setPending(null)}
        title={pending ? `${MODES[pending].emoji} Mode ${MODES[pending].label}` : ''}>
        {pending ? (
          <View className="gap-4 px-5 pb-2 pt-2">
            <Text variant="body" className="text-center text-muted">
              {MODES[pending].desc}. Active ce mode pour swiper des {MODES[pending].deckNoun} et
              compléter ton profil {MODES[pending].short.toLowerCase()}.
            </Text>
            <Button
              title={`Activer le mode ${MODES[pending].short}`}
              gradient={MODES[pending].gradient}
              loading={activate.isPending}
              onPress={() =>
                activate.mutate(pending, {
                  onSuccess: () => {
                    haptics.success();
                    setPending(null);
                    router.push('/profil/modifier');
                  },
                  onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
                })
              }
            />
            <Button title="Plus tard" variant="ghost" size="md" onPress={() => setPending(null)} />
          </View>
        ) : null}
      </Sheet>
    </>
  );
}
