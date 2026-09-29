import { Controller, type Control } from 'react-hook-form';
import { View } from 'react-native';

import { OptionRow } from '@/components/forms/option-row';
import { TagSelector } from '@/components/forms/tag-selector';
import { Chip, Text } from '@/components/ui';
import { STAGES, TICKETS } from '@/constants/profile-options';
import { ALL_SECTORS, MAX_SECTORS, POPULAR_SECTORS, SECTOR_CLUSTERS } from '@/constants/sectors';

import type { OnboardingValues } from '../schema';

export function InvestorStep({ control }: { control: Control<OnboardingValues> }) {
  return (
    <View className="gap-6">
      <View className="rounded-xl border border-investor/25 bg-investor/10 px-4 py-3">
        <Text className="text-[13px] leading-[19px] text-investor-fg">
          💡 Ton ticket et tes secteurs rassurent les fondateurs et améliorent tes recommandations.
        </Text>
      </View>
      <View className="gap-3">
        <Text variant="subheading">Ton ticket d'investissement</Text>
        <Controller
          control={control}
          name="investorTicket"
          render={({ field }) => (
            <View className="gap-2">
              {TICKETS.map((t) => (
                <OptionRow
                  key={t.id}
                  emoji={t.emoji}
                  title={t.label}
                  desc={t.desc}
                  color="#B45309"
                  selected={field.value === t.id}
                  onPress={() => field.onChange(t.id)}
                />
              ))}
            </View>
          )}
        />
      </View>
      <View className="gap-3">
        <Text variant="subheading">Secteurs qui t'intéressent</Text>
        <Controller
          control={control}
          name="investorSectors"
          render={({ field }) => (
            <TagSelector
              value={field.value}
              onChange={field.onChange}
              catalogue={ALL_SECTORS}
              popular={POPULAR_SECTORS}
              clusters={SECTOR_CLUSTERS}
              max={MAX_SECTORS}
              tone="investor"
              placeholder="FinTech, SaaS, GreenTech…"
            />
          )}
        />
      </View>
      <View className="gap-3">
        <Text variant="subheading">Stades préférés</Text>
        <Controller
          control={control}
          name="investorStages"
          render={({ field }) => (
            <View className="flex-row flex-wrap gap-2">
              {STAGES.map((s) => (
                <Chip
                  key={s.id}
                  label={s.label}
                  tone="investor"
                  selected={field.value.includes(s.id)}
                  onPress={() =>
                    field.onChange(
                      field.value.includes(s.id)
                        ? field.value.filter((v) => v !== s.id)
                        : [...field.value, s.id],
                    )
                  }
                />
              ))}
            </View>
          )}
        />
      </View>
    </View>
  );
}
