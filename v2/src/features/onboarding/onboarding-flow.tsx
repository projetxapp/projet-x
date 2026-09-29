import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  Gradient,
  IconButton,
  KeyboardScroll,
  Text,
  useToast,
  type KeyboardScrollHandle,
} from '@/components/ui';
import { BRAND_GRADIENT, MODES } from '@/constants/modes';
import { pendingAvatar, pendingSignup } from '@/features/auth/pending';
import { webUrl } from '@/lib/auth-links';
import { humanError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { uploadPublicImage } from '@/lib/images';
import { supabase, unwrap } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';
import type { Json } from '@/types/database';
import type { Mode } from '@/types/app';

import {
  buildSteps,
  EMPTY_ONBOARDING,
  onboardingSchema,
  stepFields,
  toPayload,
  type OnboardingValues,
  type OnboardingVariant,
  type StepId,
} from './schema';
import { InfoStep } from './steps/info-step';
import { InvestorStep } from './steps/investor-step';
import { PhotoStep } from './steps/photo-step';
import { ProjectStep } from './steps/project-step';
import { RecapStep } from './steps/recap-step';
import { RolesStep } from './steps/roles-step';
import { TalentStep } from './steps/talent-step';

const TITLES: Record<StepId, { title: string; sub: string }> = {
  info: { title: 'Créer mon compte', sub: 'On commence par les bases' },
  roles: { title: 'Qui es-tu ?', sub: 'Choisis un ou plusieurs profils' },
  talent: { title: '⚡ Ton profil Talent', sub: 'Pour trouver les projets qui te correspondent' },
  project: { title: '🚀 Ton profil Projet', sub: 'Pour attirer les bons talents et investisseurs' },
  investor: {
    title: '💎 Ton profil Investisseur',
    sub: "Pour matcher avec les projets qui t'intéressent",
  },
  photo: { title: '📸 Ta photo de profil', sub: 'Les profils avec photo matchent beaucoup plus' },
  recap: { title: "C'est parti !", sub: 'Ton profil est prêt 🎉' },
};

const ROLE_STEPS = new Set<StepId>(['talent', 'project', 'investor']);

type Props = {
  variant: OnboardingVariant;
  defaults?: Partial<OnboardingValues>;
  existingAvatar?: string | null;
  onExit: () => void;
};

export function OnboardingFlow({ variant, defaults, existingAvatar, onExit }: Props) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { palette } = useTheme();
  const scroll = useRef<KeyboardScrollHandle>(null);
  const [index, setIndex] = useState(0);

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema(variant)),
    defaultValues: { ...EMPTY_ONBOARDING, ...defaults },
    mode: 'onTouched',
  });
  const roles = useWatch({ control: form.control, name: 'roles' });
  const steps = useMemo(() => buildSteps(roles, variant), [roles, variant]);
  const step = steps[Math.min(index, steps.length - 1)] ?? 'info';
  const isLast = index >= steps.length - 1;
  const titles =
    step === 'info' && variant === 'complete'
      ? { title: 'Dis-nous qui tu es', sub: 'Quelques infos pour ton profil' }
      : TITLES[step];
  const stepGradient = ROLE_STEPS.has(step) ? MODES[step as Mode].gradient : BRAND_GRADIENT;

  const submit = form.handleSubmit(async (values) => {
    const payload = toPayload(values);
    try {
      if (variant === 'signup') {
        const email = values.email.trim().toLowerCase();
        const { data, error } = await supabase.auth.signUp({
          email,
          password: values.password,
          options: {
            emailRedirectTo: webUrl('/confirm'),
            data: {
              first_name: payload.first_name,
              last_name: payload.last_name,
              onboarding: payload,
            },
          },
        });
        if (error) throw error;
        if (data.user && data.user.identities?.length === 0)
          throw new Error('User already registered');
        if (values.photo) pendingAvatar.set(values.photo);
        haptics.success();
        if (data.session && data.user) {
          await pendingAvatar.uploadIfAny(data.user.id);
          router.replace('/home');
        } else {
          pendingSignup.set(email, values.password);
          router.replace({ pathname: '/verify-email', params: { email } });
        }
      } else {
        unwrap(
          await supabase.rpc('complete_onboarding', { p_payload: payload as unknown as Json }),
        );
        if (values.photo && user) {
          const url = await uploadPublicImage('avatars', user.id, values.photo, 'avatar');
          unwrap(await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id));
        }
        await queryClient.invalidateQueries({ queryKey: ['me'] });
        haptics.success();
        router.replace('/home');
      }
    } catch (error) {
      haptics.warning();
      toast.show({ title: humanError(error), tone: 'error' });
    }
  });

  const next = async () => {
    const valid = await form.trigger(stepFields(step, variant));
    if (!valid) {
      haptics.warning();
      return;
    }
    if (isLast) {
      await submit();
      return;
    }
    setIndex((i) => i + 1);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const back = () => {
    if (index === 0) onExit();
    else setIndex((i) => i - 1);
  };

  const errors = form.formState.errors;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-bg">
      <View className="w-full max-w-[560px] flex-1 self-center">
        <View className="gap-4 px-6 pb-3 pt-3">
          <View className="flex-row items-center gap-3">
            <IconButton
              accessibilityLabel="Étape précédente"
              icon={<ArrowLeft size={18} color={palette.muted} />}
              onPress={back}
            />
            <View
              className="flex-1 flex-row items-center gap-1"
              accessibilityLabel={`Étape ${index + 1} sur ${steps.length}`}>
              {steps.map((s, i) => (
                <View
                  key={s}
                  style={{
                    flex: i === index ? 2.5 : 1,
                    height: 5,
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}>
                  {i <= index ? (
                    <Gradient
                      colors={i === index ? stepGradient : BRAND_GRADIENT}
                      direction="horizontal"
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <View className="flex-1 bg-surface" />
                  )}
                </View>
              ))}
            </View>
            <Text variant="label">
              {index + 1}/{steps.length}
            </Text>
          </View>
          <View className="gap-1">
            <Text
              variant="title"
              style={ROLE_STEPS.has(step) ? { color: MODES[step as Mode].light } : undefined}>
              {titles.title}
            </Text>
            <Text variant="body" className="text-muted">
              {titles.sub}
            </Text>
          </View>
        </View>

        <KeyboardScroll ref={scroll} contentContainerClassName="px-6 pb-8 pt-2">
          {step === 'info' ? (
            <InfoStep control={form.control} errors={errors} variant={variant} />
          ) : null}
          {step === 'roles' ? <RolesStep control={form.control} errors={errors} /> : null}
          {step === 'talent' ? <TalentStep control={form.control} /> : null}
          {step === 'project' ? <ProjectStep control={form.control} errors={errors} /> : null}
          {step === 'investor' ? <InvestorStep control={form.control} /> : null}
          {step === 'photo' ? (
            <Controller
              control={form.control}
              name="photo"
              render={({ field }) => (
                <PhotoStep
                  value={field.value}
                  onChange={field.onChange}
                  existingUrl={existingAvatar}
                  onSkip={() => void next()}
                />
              )}
            />
          ) : null}
          {step === 'recap' ? (
            <RecapStep values={form.getValues()} existingAvatar={existingAvatar} />
          ) : null}
          {step === 'info' && variant === 'signup' ? (
            <Text variant="caption" className="mt-5 text-center">
              En continuant, tu acceptes nos{' '}
              <Link href="/cgu" className="font-semibold text-talent-fg">
                CGU
              </Link>{' '}
              et notre{' '}
              <Link href="/confidentialite" className="font-semibold text-talent-fg">
                politique de confidentialité
              </Link>
              .
            </Text>
          ) : null}
        </KeyboardScroll>

        <View className="px-6 pb-3 pt-2">
          <Button
            testID="onboarding-next"
            title={
              isLast
                ? variant === 'signup'
                  ? 'Créer mon compte 🚀'
                  : "C'est parti 🚀"
                : 'Continuer →'
            }
            loading={form.formState.isSubmitting}
            onPress={() => void next()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
