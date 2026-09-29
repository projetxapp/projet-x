import { describe, it, expect } from '@jest/globals';
import type { Me } from '@/types/app';

import { defaultsFrom, editSchema } from '../edit/schema';

const me = {
  profile: {
    id: 'u1',
    first_name: 'Léa',
    last_name: 'Martin',
    age: 21,
    city: '49 - Maine-et-Loire',
    school: 'ESSCA',
    active_mode: 'talent',
  },
  modes: ['talent', 'investor'],
  talent: {
    statut: 'Designer',
    bio: 'Bio',
    skills: ['Figma'],
    hours_per_week: 'medium',
    collab_modes: ['Flash'],
    links: [],
  },
  project: null,
  investor: {
    statut: 'Business Angel',
    bio: '',
    thesis: '',
    sectors: ['SaaS'],
    preferred_stages: ['Idée'],
    ticket_min: 5000,
    ticket_max: 20000,
    links: [],
  },
} as unknown as Me;

describe('profile editor schema', () => {
  it('builds defaults from the current profile (ticket mapped back to its option)', () => {
    const d = defaultsFrom(me);
    expect(d.identity).toMatchObject({ firstName: 'Léa', age: '21', school: 'ESSCA' });
    expect(d.talent?.hours).toBe('medium');
    expect(d.project).toBeUndefined();
    expect(d.investor?.ticket).toBe('small');
    expect(editSchema.safeParse(d).success).toBe(true);
  });
  it('mirrors the SQL constraints', () => {
    const d = defaultsFrom(me);
    expect(editSchema.safeParse({ ...d, identity: { ...d.identity, age: '15' } }).success).toBe(
      false,
    );
    expect(
      editSchema.safeParse({ ...d, talent: { ...d.talent!, bio: 'x'.repeat(1001) } }).success,
    ).toBe(false);
    expect(
      editSchema.safeParse({
        ...d,
        talent: { ...d.talent!, skills: Array.from({ length: 11 }, (_, i) => `s${i}`) },
      }).success,
    ).toBe(false);
  });
});
