import type { Mode } from '@/types/app';

export type Scheme = 'dark' | 'light';

/** JS mirror of the CSS variables in src/global.css (for icons, gradients, native props). */
export const PALETTES = {
  dark: {
    bg: '#08070F',
    card: '#111019',
    surface: '#1A1828',
    text: '#F0EEFF',
    muted: '#A5A1C2',
    hint: '#7C7896',
    line: 'rgba(240,238,255,0.08)',
    overlay: 'rgba(8,7,15,0.72)',
    danger: '#F87171',
  },
  light: {
    bg: '#F4F2FF',
    card: '#FFFFFF',
    surface: '#ECE9FA',
    text: '#0D0C18',
    muted: '#534F6C',
    hint: '#686482',
    line: 'rgba(13,12,24,0.08)',
    overlay: 'rgba(13,12,24,0.45)',
    danger: '#B91C1C',
  },
} as const;

export type Palette = (typeof PALETTES)[Scheme];

/** Readable accent text color of a mode on the current background (WCAG AA). */
export function modeTextColor(mode: Mode, scheme: Scheme): string {
  const map: Record<Mode, [string, string]> = {
    talent: ['#A78BFA', '#6D28D9'],
    project: ['#22D3EE', '#0E7490'],
    investor: ['#FCD34D', '#B45309'],
  };
  return scheme === 'dark' ? map[mode][0] : map[mode][1];
}
