import type { Mode } from '@/types/app';

export type ModeConfig = {
  id: Mode;
  emoji: string;
  /** Short label for the mode selector. */
  short: string;
  /** Full label ("Porteur de projet"). */
  label: string;
  desc: string;
  color: string;
  light: string;
  gradient: readonly [string, string];
  /** Label shown when swiping right. */
  likeLabel: string;
  /** What the deck shows in this mode. */
  deckNoun: string;
  /** NativeWind classes (literal strings so Tailwind can see them). */
  cls: { text: string; bg: string; bgSoft: string; border: string };
};

export const MODES: Readonly<Record<Mode, ModeConfig>> = {
  talent: {
    id: 'talent',
    emoji: '⚡',
    short: 'Talent',
    label: 'Talent',
    desc: "Propose tes compétences et rejoins des projets qui t'enflamment",
    color: '#6D28D9',
    light: '#A78BFA',
    gradient: ['#6D28D9', '#8B5CF6'],
    likeLabel: 'REJOINDRE',
    deckNoun: 'projets',
    cls: {
      text: 'text-talent-fg',
      bg: 'bg-talent',
      bgSoft: 'bg-talent/15',
      border: 'border-talent/40',
    },
  },
  project: {
    id: 'project',
    emoji: '🚀',
    short: 'Projet',
    label: 'Porteur de projet',
    desc: 'Trouve les talents et les investisseurs qui vont faire décoller ton idée',
    color: '#0891B2',
    light: '#22D3EE',
    gradient: ['#0891B2', '#06B6D4'],
    likeLabel: 'RECRUTER',
    deckNoun: 'talents',
    cls: {
      text: 'text-project-fg',
      bg: 'bg-project',
      bgSoft: 'bg-project/15',
      border: 'border-project/40',
    },
  },
  investor: {
    id: 'investor',
    emoji: '💎',
    short: 'Invest',
    label: 'Investisseur',
    desc: 'Accède aux pépites de demain avant tout le monde',
    color: '#B45309',
    light: '#FCD34D',
    gradient: ['#B45309', '#F59E0B'],
    likeLabel: 'INVESTIR',
    deckNoun: 'projets',
    cls: {
      text: 'text-investor-fg',
      bg: 'bg-investor',
      bgSoft: 'bg-investor/15',
      border: 'border-investor/40',
    },
  },
};

export const MODE_ORDER: readonly Mode[] = ['talent', 'project', 'investor'];

export const BRAND_GRADIENT = ['#6D28D9', '#0891B2'] as const;

export function isMode(value: unknown): value is Mode {
  return value === 'talent' || value === 'project' || value === 'investor';
}
