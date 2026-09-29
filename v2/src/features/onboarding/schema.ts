import { z } from 'zod';

import { TICKETS } from '@/constants/profile-options';
import type { OnboardingPayload } from '@/types/app';

export const HOURS_IDS = ['flash', 'light', 'medium', 'heavy', 'full'] as const;
export const STAGE_IDS = ['Idée', 'Prototype', 'Lancé', 'Croissance', 'Série A+'] as const;
export const TICKET_IDS = ['micro', 'small', 'medium', 'large'] as const;
export const ROLE_IDS = ['talent', 'project', 'investor'] as const;
export const COLLAB_IDS = ['Flash', 'Side', 'Equity'] as const;

export type OnboardingVariant = 'signup' | 'complete';

const base = z.object({
  firstName: z.string().trim().min(1, 'Ton prénom est requis').max(50, '50 caractères maximum'),
  lastName: z.string().trim().min(1, 'Ton nom est requis').max(50, '50 caractères maximum'),
  age: z
    .string()
    .trim()
    .min(1, 'Ton âge est requis')
    .regex(/^\d{1,3}$/, 'Indique ton âge en chiffres')
    .refine((v) => Number(v) >= 16, 'Projet X est ouvert à partir de 16 ans')
    .refine((v) => Number(v) <= 120, 'Âge invalide'),
  city: z.string().nullable(),
  school: z.string().trim().max(80, '80 caractères maximum'),
  email: z.string().trim(),
  password: z.string(),
  roles: z.array(z.enum(ROLE_IDS)).min(1, 'Choisis au moins un profil'),
  talentSkills: z.array(z.string()).max(10),
  talentHours: z.union([z.enum(HOURS_IDS), z.literal('')]),
  talentCollab: z.array(z.enum(COLLAB_IDS)),
  projectName: z.string().trim().max(80, '80 caractères maximum'),
  projectStage: z.enum(STAGE_IDS),
  projectNeeds: z.array(z.string()).max(10),
  projectSectors: z.array(z.string()).max(5),
  investorTicket: z.union([z.enum(TICKET_IDS), z.literal('')]),
  investorSectors: z.array(z.string()).max(5),
  investorStages: z.array(z.enum(STAGE_IDS)),
  photo: z.object({ uri: z.string(), width: z.number(), height: z.number() }).nullable(),
});

export type OnboardingValues = z.infer<typeof base>;

/** Email + password are only asked in the email signup variant. */
export function onboardingSchema(variant: OnboardingVariant) {
  return base.superRefine((values, ctx) => {
    if (variant !== 'signup') return;
    if (!z.email().safeParse(values.email).success) {
      ctx.addIssue({ code: 'custom', path: ['email'], message: 'Adresse email invalide' });
    }
    if (values.password.length < 8) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: '8 caractères minimum' });
    }
  });
}

export const EMPTY_ONBOARDING: OnboardingValues = {
  firstName: '',
  lastName: '',
  age: '',
  city: null,
  school: '',
  email: '',
  password: '',
  roles: [],
  talentSkills: [],
  talentHours: '',
  talentCollab: [],
  projectName: '',
  projectStage: 'Idée',
  projectNeeds: [],
  projectSectors: [],
  investorTicket: '',
  investorSectors: [],
  investorStages: [],
  photo: null,
};

/** Form values → payload applied server-side by private.apply_onboarding. */
export function toPayload(values: OnboardingValues): OnboardingPayload {
  const payload: OnboardingPayload = {
    first_name: values.firstName.trim(),
    last_name: values.lastName.trim(),
    age: Number(values.age),
    city: values.city,
    school: values.school.trim() || null,
    roles: values.roles,
  };
  if (values.roles.includes('talent')) {
    payload.talent = {
      skills: values.talentSkills,
      hours_per_week: values.talentHours,
      collab_modes: values.talentCollab,
    };
  }
  if (values.roles.includes('project')) {
    payload.project = {
      project_name: values.projectName.trim(),
      stage: values.projectStage,
      needs: values.projectNeeds,
      sectors: values.projectSectors,
    };
  }
  if (values.roles.includes('investor')) {
    payload.investor = {
      ...(values.investorTicket ? { ticket: values.investorTicket } : {}),
      sectors: values.investorSectors,
      preferred_stages: values.investorStages,
    };
  }
  return payload;
}

export type StepId = 'info' | 'roles' | 'talent' | 'project' | 'investor' | 'photo' | 'recap';

export function buildSteps(roles: readonly string[], variant: OnboardingVariant): StepId[] {
  const roleSteps = ROLE_IDS.filter((r) => roles.includes(r));
  return variant === 'signup'
    ? ['info', 'roles', ...roleSteps, 'photo', 'recap']
    : ['roles', ...roleSteps, 'info', 'photo', 'recap'];
}

/** Fields validated before leaving a step. */
export function stepFields(step: StepId, variant: OnboardingVariant): (keyof OnboardingValues)[] {
  switch (step) {
    case 'info':
      return variant === 'signup'
        ? ['firstName', 'lastName', 'age', 'school', 'email', 'password']
        : ['firstName', 'lastName', 'age', 'school'];
    case 'roles':
      return ['roles'];
    case 'project':
      return ['projectName'];
    default:
      return [];
  }
}

export function ticketLabelFor(id: OnboardingValues['investorTicket']): string | null {
  return TICKETS.find((t) => t.id === id)?.label ?? null;
}
