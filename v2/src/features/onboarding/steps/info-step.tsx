import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { View } from 'react-native';

import { PlacePicker } from '@/components/forms/place-picker';
import { Text, TextField } from '@/components/ui';

import type { OnboardingValues, OnboardingVariant } from '../schema';

type Props = {
  control: Control<OnboardingValues>;
  errors: FieldErrors<OnboardingValues>;
  variant: OnboardingVariant;
};

export function InfoStep({ control, errors, variant }: Props) {
  return (
    <View className="gap-4">
      <View className="flex-row gap-3">
        <Controller
          control={control}
          name="firstName"
          render={({ field }) => (
            <TextField
              testID="field-first-name"
              className="flex-1"
              label="Prénom"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Thomas"
              autoComplete="given-name"
              textContentType="givenName"
              error={errors.firstName?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="lastName"
          render={({ field }) => (
            <TextField
              testID="field-last-name"
              className="flex-1"
              label="Nom"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Mercier"
              autoComplete="family-name"
              textContentType="familyName"
              error={errors.lastName?.message}
            />
          )}
        />
      </View>
      <Controller
        control={control}
        name="age"
        render={({ field }) => (
          <TextField
            testID="field-age"
            label="Âge"
            value={field.value}
            onChangeText={(v) => field.onChange(v.replace(/\D/g, '').slice(0, 3))}
            onBlur={field.onBlur}
            placeholder="22"
            keyboardType="number-pad"
            hint="16 ans minimum"
            error={errors.age?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="city"
        render={({ field }) => <PlacePicker value={field.value} onChange={field.onChange} />}
      />
      <Controller
        control={control}
        name="school"
        render={({ field }) => (
          <TextField
            label="École"
            optional
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="ESSCA, ESSEC, Epitech…"
            error={errors.school?.message}
          />
        )}
      />
      {variant === 'signup' ? (
        <>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <TextField
                testID="field-email"
                label="Email"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="ton@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <TextField
                testID="field-password"
                label="Mot de passe"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="8 caractères minimum"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                error={errors.password?.message}
              />
            )}
          />
        </>
      ) : null}
      <Text variant="caption" className="text-right">
        Tu pourras tout modifier plus tard ✦
      </Text>
    </View>
  );
}
