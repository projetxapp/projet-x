import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Camera, ImagePlus } from 'lucide-react-native';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { Controller, useForm, useWatch, type Control, type FieldPath } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { StackHeader } from '@/components/app/stack-header';
import { LinksEditor } from '@/components/forms/links-editor';
import { OptionRow } from '@/components/forms/option-row';
import { PlacePicker } from '@/components/forms/place-picker';
import { TagSelector } from '@/components/forms/tag-selector';
import {
  Avatar,
  Button,
  Chip,
  Gradient,
  KeyboardScroll,
  Screen,
  Text,
  TextField,
  useToast,
} from '@/components/ui';
import { MODE_ORDER, MODES } from '@/constants/modes';
import {
  COLLAB_MODES,
  HOURS,
  SCHOOLS_SUGGESTIONS,
  STAGES,
  STATUTS,
  TICKETS,
  WORK_MODES,
} from '@/constants/profile-options';
import { ALL_SECTORS, MAX_SECTORS, POPULAR_SECTORS, SECTOR_CLUSTERS } from '@/constants/sectors';
import { ALL_SKILLS, MAX_SKILLS, POPULAR_SKILLS, SKILL_CLUSTERS } from '@/constants/skills';
import { useActivateMode } from '@/features/me/api';
import { confirm } from '@/lib/confirm';
import { humanError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { imageUrl, PermissionDeniedError } from '@/lib/images';
import type { CollabMode, Me, Mode, ProfileLink } from '@/types/app';

import { useSaveModeProfile, useUpdateProfile, useUploadPhoto } from '../api';
import { defaultsFrom, editSchema, type EditSection, type EditValues } from './schema';

const SECTIONS: { id: EditSection; label: string }[] = [
  { id: 'identity', label: '👤 Infos' },
  { id: 'talent', label: `${MODES.talent.emoji} Talent` },
  { id: 'project', label: `${MODES.project.emoji} Projet` },
  { id: 'investor', label: `${MODES.investor.emoji} Invest` },
];

type Props = { me: Me; initialSection?: EditSection };

export function EditProfileScreen({ me, initialSection }: Props) {
  const router = useRouter();
  const toast = useToast();
  const updateProfile = useUpdateProfile();
  const saveMode = useSaveModeProfile();
  const activate = useActivateMode();
  const [section, setSection] = useState<EditSection>(
    initialSection ?? (me.profile.active_mode as Mode) ?? 'identity',
  );
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: defaultsFrom(me),
    mode: 'onTouched',
  });
  const { control } = form;
  const available = SECTIONS.filter((s) => s.id === 'identity' || me.modes.includes(s.id));
  const missing = MODE_ORDER.filter((m) => !me.modes.includes(m));
  const current = available.some((s) => s.id === section) ? section : 'identity';
  const accent =
    current === 'identity' ? MODES[(me.profile.active_mode as Mode) ?? 'talent'] : MODES[current];

  const save = form.handleSubmit(
    async (v) => {
      try {
        const tasks: Promise<unknown>[] = [
          updateProfile.mutateAsync({
            first_name: v.identity.firstName,
            last_name: v.identity.lastName,
            age: v.identity.age ? Number(v.identity.age) : null,
            city: v.identity.city,
            school: v.identity.school || null,
          }),
        ];
        if (v.talent && me.modes.includes('talent')) {
          tasks.push(
            saveMode.mutateAsync({
              mode: 'talent',
              data: {
                statut: v.talent.statut,
                bio: v.talent.bio,
                skills: v.talent.skills,
                hours_per_week: v.talent.hours,
                collab_modes: v.talent.collab,
                links: v.talent.links,
              },
            }),
          );
        }
        if (v.project && me.modes.includes('project')) {
          tasks.push(
            saveMode.mutateAsync({
              mode: 'project',
              data: {
                project_name: v.project.projectName,
                statut: v.project.statut,
                description: v.project.description,
                founder_bio: v.project.founderBio,
                stage: v.project.stage,
                sectors: v.project.sectors,
                needs: v.project.needs,
                work_mode: v.project.workMode,
                collab_modes: v.project.collab,
                equity: v.project.equity,
                budget: v.project.budget,
                team_size: v.project.teamSize ? Number(v.project.teamSize) : 1,
                links: v.project.links,
              },
            }),
          );
        }
        if (v.investor && me.modes.includes('investor')) {
          const ticket = TICKETS.find((t) => t.id === v.investor!.ticket);
          tasks.push(
            saveMode.mutateAsync({
              mode: 'investor',
              data: {
                statut: v.investor.statut,
                bio: v.investor.bio,
                thesis: v.investor.thesis,
                sectors: v.investor.sectors,
                preferred_stages: v.investor.stages,
                ...(ticket ? { ticket_min: ticket.min, ticket_max: ticket.max } : {}),
                links: v.investor.links,
              },
            }),
          );
        }
        await Promise.all(tasks);
        haptics.success();
        toast.show({ title: 'Profil enregistré ✅', tone: 'success' });
        form.reset(v);
        if (router.canGoBack()) router.back();
      } catch (error) {
        toast.show({ title: humanError(error), tone: 'error' });
      }
    },
    (errors) => {
      const first = (['identity', 'talent', 'project', 'investor'] as const).find((k) => errors[k]);
      if (first) setSection(first);
      toast.show({ title: 'Vérifie les champs en rouge', tone: 'error' });
    },
  );

  const activateMode = async (mode: Mode) => {
    const ok = await confirm({
      title: `Activer le mode ${MODES[mode].label} ?`,
      message: form.formState.isDirty
        ? 'Enregistre d’abord tes modifications : elles seront perdues.'
        : MODES[mode].desc,
      confirmLabel: 'Activer',
    });
    if (!ok) return;
    activate.mutate(mode, {
      onSuccess: () =>
        toast.show({
          title: `Mode ${MODES[mode].label} activé ${MODES[mode].emoji}`,
          tone: 'success',
        }),
      onError: (error) => toast.show({ title: humanError(error), tone: 'error' }),
    });
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <StackHeader title="Modifier mon profil" />
      <View className="flex-row flex-wrap gap-2 px-5 pb-3">
        {available.map((s) => (
          <Chip
            key={s.id}
            label={s.label}
            size="sm"
            tone={s.id === 'identity' ? 'talent' : s.id}
            selected={current === s.id}
            onPress={() => setSection(s.id)}
          />
        ))}
        {missing.map((m) => (
          <Chip
            key={m}
            label={`+ ${MODES[m].short}`}
            size="sm"
            tone={m}
            onPress={() => void activateMode(m)}
            accessibilityLabel={`Activer le mode ${MODES[m].label}`}
          />
        ))}
      </View>
      <KeyboardScroll contentContainerClassName="gap-6 px-5 pb-8">
        {current === 'identity' ? <IdentitySection control={control} me={me} /> : null}
        {current === 'talent' ? <TalentSection control={control} /> : null}
        {current === 'project' ? <ProjectSection control={control} me={me} /> : null}
        {current === 'investor' ? <InvestorSection control={control} /> : null}
      </KeyboardScroll>
      <View className="border-t border-line/10 px-5 pb-2 pt-3">
        <Button
          testID="profile-save"
          title="Enregistrer"
          gradient={accent.gradient}
          loading={form.formState.isSubmitting}
          disabled={!form.formState.isDirty}
          onPress={() => void save()}
        />
      </View>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Sections (module scope: never re-created on render → inputs keep their focus)
// ---------------------------------------------------------------------------

type SectionProps = { control: Control<EditValues> };

function Field({
  control,
  name,
  ...props
}: SectionProps & { name: FieldPath<EditValues> } & Omit<
    ComponentProps<typeof TextField>,
    'value' | 'onChangeText'
  >) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          value={typeof field.value === 'string' ? field.value : ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

function Suggestions({
  control,
  name,
  options,
  tone,
}: SectionProps & { name: FieldPath<EditValues>; options: readonly string[]; tone: Mode }) {
  const value = useWatch({ control, name });
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
        const matches = options
          .filter((o) => (text ? o.toLowerCase().includes(text) && o.toLowerCase() !== text : true))
          .slice(0, 8);
        if (matches.length === 0) return <></>;
        return (
          <View className="-mt-3 flex-row flex-wrap gap-1.5">
            {matches.map((o) => (
              <Chip key={o} label={o} size="sm" tone={tone} onPress={() => field.onChange(o)} />
            ))}
          </View>
        );
      }}
    />
  );
}

function Multi<T extends string>({
  value,
  onChange,
  options,
  tone,
}: {
  value: T[];
  onChange: (v: T[]) => void;
  options: readonly { id: T; label: string; emoji?: string }[];
  tone: Mode;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => (
        <Chip
          key={o.id}
          label={o.label}
          emoji={o.emoji}
          tone={tone}
          selected={value.includes(o.id)}
          onPress={() =>
            onChange(value.includes(o.id) ? value.filter((v) => v !== o.id) : [...value, o.id])
          }
        />
      ))}
    </View>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text variant="subheading">{title}</Text>
      {children}
    </View>
  );
}

function IdentitySection({ control, me }: SectionProps & { me: Me }) {
  const toast = useToast();
  const upload = useUploadPhoto();
  const p = me.profile;
  const mode = (p.active_mode as Mode) ?? 'talent';
  return (
    <>
      <View className="items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Changer ma photo"
          disabled={upload.isPending}
          onPress={() =>
            upload.mutate('avatar', {
              onError: (error) =>
                toast.show({
                  title: error instanceof PermissionDeniedError ? error.message : humanError(error),
                  tone: 'error',
                }),
            })
          }>
          <Avatar
            uri={p.avatar_url}
            firstName={p.first_name}
            lastName={p.last_name}
            size={96}
            gradient={MODES[mode].gradient}
          />
          <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-bg bg-talent">
            <Camera size={15} color="#FFFFFF" />
          </View>
        </Pressable>
        <Text variant="caption">
          {upload.isPending ? 'Envoi de la photo…' : 'Une vraie photo = 3× plus de matchs'}
        </Text>
      </View>
      <View className="flex-row gap-3">
        <Field
          control={control}
          name="identity.firstName"
          label="Prénom"
          className="flex-1"
          autoComplete="given-name"
          maxLength={50}
        />
        <Field
          control={control}
          name="identity.lastName"
          label="Nom"
          className="flex-1"
          autoComplete="family-name"
          maxLength={50}
        />
      </View>
      <Field
        control={control}
        name="identity.age"
        label="Âge"
        optional
        keyboardType="number-pad"
        maxLength={3}
        placeholder="21"
      />
      <Controller
        control={control}
        name="identity.city"
        render={({ field }) => <PlacePicker value={field.value} onChange={field.onChange} />}
      />
      <Field
        control={control}
        name="identity.school"
        label="École"
        optional
        placeholder="ESSCA, HEC, 42…"
        maxLength={80}
      />
      <Suggestions
        control={control}
        name="identity.school"
        options={SCHOOLS_SUGGESTIONS}
        tone={mode}
      />
    </>
  );
}

function TalentSection({ control }: SectionProps) {
  return (
    <>
      <Field
        control={control}
        name="talent.statut"
        label="Statut"
        placeholder="Étudiant(e), Freelance…"
        maxLength={60}
      />
      <Suggestions control={control} name="talent.statut" options={STATUTS} tone="talent" />
      <Field
        control={control}
        name="talent.bio"
        label="Bio"
        placeholder="Qui es-tu, qu'as-tu déjà réalisé, qu'est-ce qui te motive ?"
        multiline
        maxLength={1000}
      />
      <Block title="Compétences">
        <Controller
          control={control}
          name="talent.skills"
          render={({ field, fieldState }) => (
            <>
              <TagSelector
                value={field.value ?? []}
                onChange={field.onChange}
                catalogue={ALL_SKILLS}
                popular={POPULAR_SKILLS}
                clusters={SKILL_CLUSTERS}
                max={MAX_SKILLS}
                tone="talent"
              />
              {fieldState.error ? (
                <Text className="text-[12px] text-danger-fg">{fieldState.error.message}</Text>
              ) : null}
            </>
          )}
        />
      </Block>
      <Block title="Disponibilité">
        <Controller
          control={control}
          name="talent.hours"
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
      </Block>
      <Block title="Modes de collaboration">
        <Controller
          control={control}
          name="talent.collab"
          render={({ field }) => (
            <Multi<CollabMode>
              value={field.value ?? []}
              onChange={field.onChange}
              options={COLLAB_MODES}
              tone="talent"
            />
          )}
        />
      </Block>
      <Block title="Liens">
        <Controller
          control={control}
          name="talent.links"
          render={({ field }) => (
            <LinksEditor
              value={(field.value ?? []) as ProfileLink[]}
              onChange={field.onChange}
              tone="talent"
            />
          )}
        />
      </Block>
    </>
  );
}

function ProjectSection({ control, me }: SectionProps & { me: Me }) {
  const toast = useToast();
  const upload = useUploadPhoto();
  const cover = me.project?.cover_url;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Changer la couverture du projet"
        disabled={upload.isPending}
        onPress={() =>
          upload.mutate('cover', {
            onError: (error) =>
              toast.show({
                title: error instanceof PermissionDeniedError ? error.message : humanError(error),
                tone: 'error',
              }),
          })
        }
        className="overflow-hidden rounded-card">
        {cover ? (
          <Image
            source={{ uri: imageUrl(cover, 560) }}
            style={{ height: 150 }}
            contentFit="cover"
          />
        ) : (
          <Gradient
            colors={MODES.project.gradient}
            style={{ height: 150, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ImagePlus size={28} color="#FFFFFF" />
            <Text className="text-[14px] font-bold text-white">Ajoute une vraie couverture</Text>
          </Gradient>
        )}
        {upload.isPending ? (
          <View className="absolute inset-0 items-center justify-center bg-black/40">
            <Text className="font-bold text-white">Envoi…</Text>
          </View>
        ) : null}
      </Pressable>
      <Field control={control} name="project.projectName" label="Nom du projet" maxLength={80} />
      <Field
        control={control}
        name="project.description"
        label="Description"
        placeholder="Le problème, ta solution, où tu en es."
        multiline
        maxLength={2000}
      />
      <Block title="Stade">
        <Controller
          control={control}
          name="project.stage"
          render={({ field }) => (
            <View className="gap-2">
              {STAGES.map((s) => (
                <OptionRow
                  key={s.id}
                  dotColor={s.color}
                  title={s.label}
                  desc={s.desc}
                  selected={field.value === s.id}
                  onPress={() => field.onChange(s.id)}
                  color="#0891B2"
                />
              ))}
            </View>
          )}
        />
      </Block>
      <Block title="Compétences recherchées">
        <Controller
          control={control}
          name="project.needs"
          render={({ field }) => (
            <TagSelector
              value={field.value ?? []}
              onChange={field.onChange}
              catalogue={ALL_SKILLS}
              popular={POPULAR_SKILLS}
              clusters={SKILL_CLUSTERS}
              max={MAX_SKILLS}
              tone="project"
            />
          )}
        />
      </Block>
      <Block title="Secteurs">
        <Controller
          control={control}
          name="project.sectors"
          render={({ field }) => (
            <TagSelector
              value={field.value ?? []}
              onChange={field.onChange}
              catalogue={ALL_SECTORS}
              popular={POPULAR_SECTORS}
              clusters={SECTOR_CLUSTERS}
              max={MAX_SECTORS}
              tone="project"
            />
          )}
        />
      </Block>
      <Block title="Organisation">
        <Controller
          control={control}
          name="project.workMode"
          render={({ field }) => (
            <View className="gap-2">
              {WORK_MODES.map((w) => (
                <OptionRow
                  key={w.id}
                  emoji={w.emoji}
                  title={w.label}
                  desc={w.desc}
                  selected={field.value === w.id}
                  onPress={() => field.onChange(w.id)}
                  color="#0891B2"
                />
              ))}
            </View>
          )}
        />
        <Controller
          control={control}
          name="project.collab"
          render={({ field }) => (
            <Multi<CollabMode>
              value={field.value ?? []}
              onChange={field.onChange}
              options={COLLAB_MODES}
              tone="project"
            />
          )}
        />
      </Block>
      <View className="flex-row gap-3">
        <Field
          control={control}
          name="project.budget"
          label="Budget"
          optional
          placeholder="300 € / mission"
          className="flex-1"
          maxLength={60}
        />
        <Field
          control={control}
          name="project.equity"
          label="Equity"
          optional
          placeholder="5 à 10 %"
          className="flex-1"
          maxLength={60}
        />
      </View>
      <Field
        control={control}
        name="project.teamSize"
        label="Taille de l'équipe"
        optional
        keyboardType="number-pad"
        maxLength={4}
        placeholder="2"
      />
      <Field
        control={control}
        name="project.statut"
        label="Ton rôle"
        placeholder="Fondateur(rice), CEO…"
        maxLength={60}
      />
      <Field
        control={control}
        name="project.founderBio"
        label="Bio du fondateur"
        optional
        placeholder="Ton parcours en quelques lignes"
        multiline
        maxLength={1000}
      />
      <Block title="Liens (pitch deck, démo, site…)">
        <Controller
          control={control}
          name="project.links"
          render={({ field }) => (
            <LinksEditor
              value={(field.value ?? []) as ProfileLink[]}
              onChange={field.onChange}
              tone="project"
            />
          )}
        />
      </Block>
    </>
  );
}

function InvestorSection({ control }: SectionProps) {
  return (
    <>
      <Field
        control={control}
        name="investor.statut"
        label="Statut"
        placeholder="Business Angel, VC…"
        maxLength={60}
      />
      <Suggestions
        control={control}
        name="investor.statut"
        options={[
          'Business Angel',
          'Partner VC',
          'Associé(e) VC',
          'Family office',
          'Investisseur(se)',
        ]}
        tone="investor"
      />
      <Field
        control={control}
        name="investor.bio"
        label="Bio"
        multiline
        maxLength={1000}
        placeholder="Ton parcours, tes investissements passés"
      />
      <Field
        control={control}
        name="investor.thesis"
        label="Thèse d'investissement"
        multiline
        maxLength={1000}
        placeholder="Ce que tu cherches, ce que tu apportes"
      />
      <Block title="Ticket">
        <Controller
          control={control}
          name="investor.ticket"
          render={({ field }) => (
            <View className="gap-2">
              {TICKETS.map((t) => (
                <OptionRow
                  key={t.id}
                  emoji={t.emoji}
                  title={t.label}
                  desc={t.desc}
                  selected={field.value === t.id}
                  onPress={() => field.onChange(t.id)}
                  color="#B45309"
                />
              ))}
            </View>
          )}
        />
      </Block>
      <Block title="Secteurs">
        <Controller
          control={control}
          name="investor.sectors"
          render={({ field }) => (
            <TagSelector
              value={field.value ?? []}
              onChange={field.onChange}
              catalogue={ALL_SECTORS}
              popular={POPULAR_SECTORS}
              clusters={SECTOR_CLUSTERS}
              max={10}
              tone="investor"
            />
          )}
        />
      </Block>
      <Block title="Stades qui t'intéressent">
        <Controller
          control={control}
          name="investor.stages"
          render={({ field }) => (
            <Multi
              value={field.value ?? []}
              onChange={field.onChange}
              options={STAGES}
              tone="investor"
            />
          )}
        />
      </Block>
      <Block title="Liens">
        <Controller
          control={control}
          name="investor.links"
          render={({ field }) => (
            <LinksEditor
              value={(field.value ?? []) as ProfileLink[]}
              onChange={field.onChange}
              tone="investor"
            />
          )}
        />
      </Block>
    </>
  );
}
