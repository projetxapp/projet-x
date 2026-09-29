import { Controller, type Control } from 'react-hook-form';
import { View } from 'react-native';

import { OptionRow } from '@/components/forms/option-row';
import { TagSelector } from '@/components/forms/tag-selector';
import { Chip, Text } from '@/components/ui';
import { COLLAB_MODES, HOURS } from '@/constants/profile-options';
import { ALL_SKILLS, MAX_SKILLS, POPULAR_SKILLS, SKILL_CLUSTERS } from '@/constants/skills';

import type { OnboardingValues } from '../schema';

export function TalentStep({ control }: { control: Control<OnboardingValues> }) {
  return (
    <View className="gap-6">
      <View className="gap-3">
        <Text variant="subheading">Tes compétences principales</Text>
        <Controller
          control={control}
          name="talentSkills"
          render={({ field }) => (
            <TagSelector
              value={field.value}
              onChange={field.onChange}
              catalogue={ALL_SKILLS}
              popular={POPULAR_SKILLS}
              clusters={SKILL_CLUSTERS}
              max={MAX_SKILLS}
              tone="talent"
            />
          )}
        />
      </View>
      <View className="gap-3">
        <Text variant="subheading">Ta disponibilité</Text>
        <Controller
          control={control}
          name="talentHours"
          render={({ field }) => (
            <View className="gap-2">
              {HOURS.map((h) => (
                <OptionRow
                  key={h.id}
                  emoji={h.emoji}
                  title={h.label}
                  desc={h.desc}
                  selected={field.value === h.id}
                  onPress={() => field.onChange(h.id)}
                />
              ))}
            </View>
          )}
        />
      </View>
      <View className="gap-3">
        <Text variant="subheading">Comment tu veux collaborer ?</Text>
        <Controller
          control={control}
          name="talentCollab"
          render={({ field }) => (
            <View className="flex-row flex-wrap gap-2">
              {COLLAB_MODES.map((c) => (
                <Chip
                  key={c.id}
                  emoji={c.emoji}
                  label={c.label}
                  selected={field.value.includes(c.id)}
                  onPress={() =>
                    field.onChange(
                      field.value.includes(c.id)
                        ? field.value.filter((v) => v !== c.id)
                        : [...field.value, c.id],
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
