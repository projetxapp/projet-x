import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { View } from 'react-native';

import { OptionRow } from '@/components/forms/option-row';
import { TagSelector } from '@/components/forms/tag-selector';
import { Text, TextField } from '@/components/ui';
import { STAGES } from '@/constants/profile-options';
import { ALL_SECTORS, MAX_SECTORS, POPULAR_SECTORS, SECTOR_CLUSTERS } from '@/constants/sectors';
import { ALL_SKILLS, MAX_SKILLS, POPULAR_SKILLS, SKILL_CLUSTERS } from '@/constants/skills';

import type { OnboardingValues } from '../schema';

export function ProjectStep({
  control,
  errors,
}: {
  control: Control<OnboardingValues>;
  errors: FieldErrors<OnboardingValues>;
}) {
  return (
    <View className="gap-6">
      <Controller
        control={control}
        name="projectName"
        render={({ field }) => (
          <TextField
            testID="field-project-name"
            label="Nom du projet"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="EcoTrack, Flio, MindFlow…"
            accent="#0891B2"
            error={errors.projectName?.message}
          />
        )}
      />
      <View className="gap-3">
        <Text variant="subheading">Stade d'avancement</Text>
        <Controller
          control={control}
          name="projectStage"
          render={({ field }) => (
            <View className="gap-2">
              {STAGES.map((s) => (
                <OptionRow
                  key={s.id}
                  dotColor={s.color}
                  title={s.label}
                  desc={s.desc}
                  color={s.color}
                  selected={field.value === s.id}
                  onPress={() => field.onChange(s.id)}
                />
              ))}
            </View>
          )}
        />
      </View>
      <View className="gap-3">
        <Text variant="subheading">Les compétences que tu recherches</Text>
        <Controller
          control={control}
          name="projectNeeds"
          render={({ field }) => (
            <TagSelector
              value={field.value}
              onChange={field.onChange}
              catalogue={ALL_SKILLS}
              popular={POPULAR_SKILLS}
              clusters={SKILL_CLUSTERS}
              max={MAX_SKILLS}
              tone="project"
            />
          )}
        />
      </View>
      <View className="gap-3">
        <Text variant="subheading">Secteurs</Text>
        <Controller
          control={control}
          name="projectSectors"
          render={({ field }) => (
            <TagSelector
              value={field.value}
              onChange={field.onChange}
              catalogue={ALL_SECTORS}
              popular={POPULAR_SECTORS}
              clusters={SECTOR_CLUSTERS}
              max={MAX_SECTORS}
              tone="project"
              placeholder="FinTech, EdTech, GreenTech…"
            />
          )}
        />
      </View>
    </View>
  );
}
