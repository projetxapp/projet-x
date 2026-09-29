import { z } from 'zod';

import { LINK_TYPES, TICKETS } from '@/constants/profile-options';
import type { Me, ProfileLink } from '@/types/app';

/** Mirrors the SQL constraints (profiles / *_profiles check constraints). */
const optionalInt = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max), message);

const links = z
  .array(
    z.object({
      type: z.enum(LINK_TYPES.map((l) => l.id) as [ProfileLink['type'], ...ProfileLink['type'][]]),
      label: z.string(),
      url: z.string().trim().min(3, 'Lien invalide').max(300, 'Lien trop long'),
      icon: z.string().optional(),
    }),
  )
  .max(10, '10 liens maximum');

const collab = z.array(z.enum(['Flash', 'Side', 'Equity']));
const stage = z.enum(['Idée', 'Prototype', 'Lancé', 'Croissance', 'Série A+']);

export const editSchema = z.object({
  identity: z.object({
    firstName: z.string().trim().min(1, 'Ton prénom est requis').max(50, '50 caractères maximum'),
    lastName: z.string().trim().min(1, 'Ton nom est requis').max(50, '50 caractères maximum'),
    age: optionalInt(16, 120, 'Tu dois avoir au moins 16 ans'),
    city: z.string().max(80).nullable(),
    school: z.string().trim().max(80, '80 caractères maximum'),
  }),
  talent: z
    .object({
      statut: z.string().trim().max(60, '60 caractères maximum'),
      bio: z.string().trim().max(1000, '1 000 caractères maximum'),
      skills: z.array(z.string()).max(10, '10 compétences maximum'),
      hours: z.enum(['', 'flash', 'light', 'medium', 'heavy', 'full']),
      collab,
      links,
    })
    .optional(),
  project: z
    .object({
      projectName: z
        .string()
        .trim()
        .min(1, 'Donne un nom à ton projet')
        .max(80, '80 caractères maximum'),
      statut: z.string().trim().max(60, '60 caractères maximum'),
      description: z.string().trim().max(2000, '2 000 caractères maximum'),
      founderBio: z.string().trim().max(1000, '1 000 caractères maximum'),
      stage,
      sectors: z.array(z.string()).max(5, '5 secteurs maximum'),
      needs: z.array(z.string()).max(10, '10 compétences maximum'),
      workMode: z.enum(['remote', 'hybrid', 'onsite']),
      collab,
      equity: z.string().trim().max(60, '60 caractères maximum'),
      budget: z.string().trim().max(60, '60 caractères maximum'),
      teamSize: optionalInt(1, 1000, "Taille d'équipe entre 1 et 1 000"),
      links,
    })
    .optional(),
  investor: z
    .object({
      statut: z.string().trim().max(60, '60 caractères maximum'),
      bio: z.string().trim().max(1000, '1 000 caractères maximum'),
      thesis: z.string().trim().max(1000, '1 000 caractères maximum'),
      sectors: z.array(z.string()).max(10, '10 secteurs maximum'),
      stages: z.array(stage),
      ticket: z.enum(['', 'micro', 'small', 'medium', 'large']),
      links,
    })
    .optional(),
});

export type EditValues = z.infer<typeof editSchema>;
export type EditSection = 'identity' | 'talent' | 'project' | 'investor';

const asLinks = (value: unknown): ProfileLink[] =>
  Array.isArray(value) ? (value as ProfileLink[]) : [];

export function defaultsFrom(me: Me): EditValues {
  const p = me.profile;
  const t = me.talent;
  const pp = me.project;
  const i = me.investor;
  const ticket = i
    ? TICKETS.find((x) => x.min === i.ticket_min && x.max === i.ticket_max)?.id
    : undefined;
  return {
    identity: {
      firstName: p.first_name ?? '',
      lastName: p.last_name ?? '',
      age: p.age ? String(p.age) : '',
      city: p.city ?? null,
      school: p.school ?? '',
    },
    talent: t
      ? {
          statut: t.statut ?? '',
          bio: t.bio ?? '',
          skills: t.skills ?? [],
          hours: (t.hours_per_week || '') as NonNullable<EditValues['talent']>['hours'],
          collab: (t.collab_modes ?? []) as NonNullable<EditValues['talent']>['collab'],
          links: asLinks(t.links),
        }
      : undefined,
    project: pp
      ? {
          projectName: pp.project_name ?? '',
          statut: pp.statut ?? '',
          description: pp.description ?? '',
          founderBio: pp.founder_bio ?? '',
          stage: (pp.stage || 'Idée') as NonNullable<EditValues['project']>['stage'],
          sectors: pp.sectors ?? [],
          needs: pp.needs ?? [],
          workMode: (pp.work_mode || 'remote') as NonNullable<EditValues['project']>['workMode'],
          collab: (pp.collab_modes ?? []) as NonNullable<EditValues['project']>['collab'],
          equity: pp.equity ?? '',
          budget: pp.budget ?? '',
          teamSize: pp.team_size ? String(pp.team_size) : '',
          links: asLinks(pp.links),
        }
      : undefined,
    investor: i
      ? {
          statut: i.statut ?? '',
          bio: i.bio ?? '',
          thesis: i.thesis ?? '',
          sectors: i.sectors ?? [],
          stages: (i.preferred_stages ?? []) as NonNullable<EditValues['investor']>['stages'],
          ticket: ticket ?? '',
          links: asLinks(i.links),
        }
      : undefined,
  };
}
