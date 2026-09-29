import type { Me, Mode } from '@/types/app';

type Item = { label: string; weight: number; done: boolean };

export type Completion = { percent: number; missing: { label: string; weight: number }[] };

/** Profile completion for the active mode, with what is missing ("Ajoute ta bio +20 %"). */
export function profileCompletion(me: Me, mode: Mode): Completion {
  const hasAvatar = Boolean(me.profile.avatar_url);
  let items: Item[] = [];

  if (mode === 'talent' && me.talent) {
    const t = me.talent;
    items = [
      { label: 'Ajoute une photo', weight: 15, done: hasAvatar },
      { label: 'Écris ta bio', weight: 20, done: t.bio.trim().length > 0 },
      { label: 'Ajoute tes compétences', weight: 25, done: t.skills.length > 0 },
      { label: 'Indique ta disponibilité', weight: 15, done: t.hours_per_week !== '' },
      { label: 'Choisis tes modes de collab', weight: 15, done: t.collab_modes.length > 0 },
      {
        label: 'Ajoute un lien (portfolio, GitHub…)',
        weight: 10,
        done: Array.isArray(t.links) && t.links.length > 0,
      },
    ];
  } else if (mode === 'project' && me.project) {
    const p = me.project;
    items = [
      {
        label: 'Ajoute une photo ou une couverture',
        weight: 10,
        done: hasAvatar || Boolean(p.cover_url),
      },
      { label: 'Donne un nom à ton projet', weight: 15, done: p.project_name.trim().length > 0 },
      { label: 'Décris ton projet', weight: 20, done: p.description.trim().length > 0 },
      { label: 'Ajoute tes secteurs', weight: 15, done: p.sectors.length > 0 },
      { label: 'Liste les compétences recherchées', weight: 20, done: p.needs.length > 0 },
      { label: 'Choisis tes modes de collab', weight: 10, done: p.collab_modes.length > 0 },
      { label: 'Présente-toi (bio fondateur)', weight: 10, done: p.founder_bio.trim().length > 0 },
    ];
  } else if (mode === 'investor' && me.investor) {
    const i = me.investor;
    items = [
      { label: 'Ajoute une photo', weight: 15, done: hasAvatar },
      { label: 'Écris ta bio', weight: 15, done: i.bio.trim().length > 0 },
      { label: "Décris ta thèse d'investissement", weight: 20, done: i.thesis.trim().length > 0 },
      { label: 'Choisis tes secteurs', weight: 20, done: i.sectors.length > 0 },
      {
        label: 'Choisis les stades qui t’intéressent',
        weight: 15,
        done: i.preferred_stages.length > 0,
      },
      { label: 'Indique ton ticket', weight: 15, done: i.ticket_min > 0 || i.ticket_max > 0 },
    ];
  }

  if (items.length === 0) return { percent: 0, missing: [] };
  const percent = items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
  const missing = items.filter((i) => !i.done).map(({ label, weight }) => ({ label, weight }));
  return { percent, missing };
}
