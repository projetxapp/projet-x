import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { MODE_ORDER } from '@/constants/modes';

import { RoleCard } from '../role-card';
import type { OnboardingValues } from '../schema';

export function RolesStep({
  control,
  errors,
}: {
  control: Control<OnboardingValues>;
  errors: FieldErrors<OnboardingValues>;
}) {
  return (
    <Controller
      control={control}
      name="roles"
      render={({ field }) => (
        <View className="gap-3">
          <View className="flex-row items-center gap-2 rounded-xl border border-talent/20 bg-talent/10 px-3.5 py-2.5">
            <Text className="text-[16px]">💡</Text>
            <Text className="flex-1 text-[13px] leading-[18px] text-talent-fg">
              Tu peux choisir plusieurs profils — par exemple Talent et Porteur de projet.
            </Text>
          </View>
          {MODE_ORDER.map((mode) => (
            <RoleCard
              key={mode}
              mode={mode}
              selected={field.value.includes(mode)}
              onPress={() =>
                field.onChange(
                  field.value.includes(mode)
                    ? field.value.filter((m) => m !== mode)
                    : [...field.value, mode],
                )
              }
            />
          ))}
          {errors.roles?.message ? (
            <Text className="text-[12px] font-semibold text-danger-fg">{errors.roles.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
}
