import { describe, it, expect } from '@jest/globals';
import {
  activityLabel,
  chatTime,
  formatBytes,
  fullName,
  greeting,
  initials,
  normalizeUrl,
  plural,
  relativeTime,
  ticketLabel,
  truncate,
} from '../format';

const at = (iso: string) => new Date(iso);

describe('greeting', () => {
  it('depends on the hour and includes the first name', () => {
    expect(greeting('Léa', at('2026-09-29T08:00:00'))).toBe('Bonjour Léa ☀️');
    expect(greeting('Léa', at('2026-09-29T14:00:00'))).toBe('Bon après-midi Léa 👋');
    expect(greeting('Léa', at('2026-09-29T20:00:00'))).toBe('Bonsoir Léa 🌙');
    expect(greeting('Léa', at('2026-09-29T02:00:00'))).toBe('Encore debout, Léa ? 🦉');
    expect(greeting(null, at('2026-09-29T08:00:00'))).toBe('Bonjour ☀️');
  });
});

describe('names', () => {
  it('builds full names and initials with fallbacks', () => {
    expect(fullName(' Léa ', 'Martin')).toBe('Léa Martin');
    expect(fullName(null, undefined)).toBe('Profil Projet X');
    expect(initials('léa', 'martin')).toBe('LM');
    expect(initials(null, null)).toBe('✦');
  });
});

describe('plural', () => {
  it('pluralizes above one', () => {
    expect(plural(0, 'match')).toBe('0 match');
    expect(plural(1, 'match')).toBe('1 match');
    expect(plural(3, 'nouveau profil', 'nouveaux profils')).toBe('3 nouveaux profils');
  });
});

describe('relative dates', () => {
  const now = at('2026-09-29T15:00:00');
  it('formats relative times in French', () => {
    expect(relativeTime('2026-09-29T14:59:40', now)).toBe("à l'instant");
    expect(relativeTime('2026-09-29T14:45:00', now)).toBe('il y a 15 min');
    expect(relativeTime('2026-09-29T12:00:00', now)).toBe('il y a 3 h');
    expect(relativeTime('2026-09-28T12:00:00', now)).toBe('hier');
    expect(relativeTime('2026-09-25T12:00:00', now)).toBe('il y a 4 j');
    expect(relativeTime('2026-08-01T12:00:00', now)).toBe('01/08');
    expect(relativeTime(null, now)).toBe('');
  });
  it('formats conversation timestamps', () => {
    expect(chatTime('2026-09-29T09:05:00', now)).toBe('09:05');
    expect(chatTime(undefined, now)).toBe('');
  });
  it('labels recent activity only', () => {
    expect(activityLabel('2026-09-29T14:55:00', now)).toBe('En ligne');
    expect(activityLabel('2026-09-29T08:00:00', now)).toBe("Actif·ve aujourd'hui");
    expect(activityLabel('2026-09-25T08:00:00', now)).toBe('Actif·ve cette semaine');
    expect(activityLabel('2026-08-01T08:00:00', now)).toBeNull();
  });
});

describe('money, files, links', () => {
  it('formats euros and tickets', () => {
    expect(ticketLabel(0, 0)).toBeNull();
    expect(ticketLabel(5000, 20000)).toMatch(/^5\s000 € – 20\s000 €$/);
    expect(ticketLabel(100000, 0)).toMatch(/^100\s000 € et \+$/);
    expect(ticketLabel(0, 5000)).toMatch(/^jusqu'à 5\s000 €$/);
  });
  it('formats file sizes', () => {
    expect(formatBytes(0)).toBe('');
    expect(formatBytes(340 * 1024)).toBe('340 Ko');
    expect(formatBytes(1.25 * 1024 * 1024)).toBe('1,3 Mo');
  });
  it('normalizes URLs and truncates', () => {
    expect(normalizeUrl('github.com/moi')).toBe('https://github.com/moi');
    expect(normalizeUrl('http://site.fr')).toBe('http://site.fr');
    expect(truncate('Bonjour tout le monde', 8)).toBe('Bonjour…');
    expect(truncate('court', 8)).toBe('court');
  });
});
